import { google, sheets_v4 } from "googleapis";
import { JWT } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { IRepository, IDatabase } from "../interfaces/IRepository";
import {
  User,
  BusinessProfile,
  Customer,
  Product,
  Order,
  Lead,
  Setting,
  WhatsAppSession
} from "../types";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountJson: string; // JSON string or base64 encoded JSON
}

export class GoogleSheetsThrottler {
  private lastRequestTime = 0;
  private minIntervalMs = 250; // Max 4 requests/sec = 240 requests/min (well below 300/min quota)

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}

export class GoogleSheetsRepository<T extends { id: string; createdAt?: string; updatedAt?: string }>
  implements IRepository<T>
{
  private cache: Map<string, T> = new Map();
  private cacheLoaded = false;
  private cacheExpiry = 0;
  private ttlMs = 15000; // 15s read cache

  constructor(
    private sheets: sheets_v4.Sheets,
    private spreadsheetId: string,
    private sheetName: string,
    private headers: (keyof T)[],
    private throttler: GoogleSheetsThrottler
  ) {}

  private async executeWithRetry<R>(fn: () => Promise<R>, retries = 3, delay = 1000): Promise<R> {
    await this.throttler.throttle();
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error.status === 503 || error.code === 429)) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private rowToEntity(row: string[]): T {
    const entity: any = {};
    this.headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index] : "";
      if (typeof val === "string" && val.startsWith("'")) {
        val = val.substring(1);
      }
      if (val === "" || val === undefined || val === "#ERROR!") {
        entity[header] = undefined;
      } else {
        const num = Number(val);
        const headerStr = (header as string).toLowerCase();
        const isNumeric = headerStr.includes("count") || headerStr.includes("price") || headerStr.includes("rating") || headerStr.includes("stock") || headerStr.includes("amount");
        if (isNumeric && !isNaN(num) && val.trim() !== "") {
          entity[header] = num;
        } else {
          entity[header] = val;
        }
      }
    });
    return entity as T;
  }

  private entityToRow(entity: Partial<T>): string[] {
    return this.headers.map((h) => {
      const val = (entity as any)[h];
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.startsWith("+") || str.startsWith("=") || (str.startsWith("-") && isNaN(Number(str)))) {
        return `'${str}`;
      }
      return str;
    });
  }

  private async loadAll(): Promise<Map<string, T>> {
    const now = Date.now();
    if (this.cacheLoaded && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const res = await this.executeWithRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2:Z`,
        })
      );

      const rows = res.data.values || [];
      this.cache.clear();
      for (const r of rows) {
        if (r[0]) {
          const item = this.rowToEntity(r);
          this.cache.set(item.id, item);
        }
      }
      this.cacheLoaded = true;
      this.cacheExpiry = now + this.ttlMs;
      return this.cache;
    } catch (err: any) {
      console.warn(`[GoogleSheetsRepository] loadAll failed on ${this.sheetName}: ${err.message}. Serving from cache.`);
      this.cacheLoaded = true;
      this.cacheExpiry = now + this.ttlMs;
      return this.cache;
    }
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const item = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    const row = this.entityToRow(item);

    try {
      await this.executeWithRetry(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [row],
          },
        })
      );
    } catch (err: any) {
      console.warn(`[GoogleSheetsRepository] append failed on ${this.sheetName}: ${err.message}. Item stored in local cache.`);
    }

    this.cache.set(id, item);
    return item;
  }

  async findById(id: string): Promise<T | null> {
    const map = await this.loadAll();
    return map.get(id) || null;
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const all = await this.findMany(filter);
    return all.length > 0 ? all[0] : null;
  }

  async findMany(filter?: Partial<T>): Promise<T[]> {
    const map = await this.loadAll();
    let list = Array.from(map.values());
    if (!filter) return list;

    return list.filter((item) => {
      for (const [k, v] of Object.entries(filter)) {
        if ((item as any)[k] !== v) return false;
      }
      return true;
    });
  }

  async update(id: string, updates: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null> {
    await this.loadAll();
    const existing = this.cache.get(id);
    if (!existing) return null;

    const updatedItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await this.executeWithRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2:A`,
        })
      );

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 2;
        const row = this.entityToRow(updatedItem);

        await this.executeWithRetry(() =>
          this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${sheetRowNumber}:Z${sheetRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [row],
            },
          })
        );
      }
    } catch (err: any) {
      console.warn(`[GoogleSheetsRepository] update failed on ${this.sheetName}: ${err.message}. Updated in local cache.`);
    }

    this.cache.set(id, updatedItem);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    await this.loadAll();
    const existing = this.cache.get(id);
    if (!existing) return false;

    try {
      const res = await this.executeWithRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2:A`,
        })
      );

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === id);
      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 2;

        await this.executeWithRetry(() =>
          this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${sheetRowNumber}:Z${sheetRowNumber}`,
          })
        );
      }
    } catch (err: any) {
      console.warn(`[GoogleSheetsRepository] delete failed on ${this.sheetName}: ${err.message}. Removed from local cache.`);
    }

    this.cache.delete(id);
    return true;
  }
}

export class GoogleSheetsDatabase implements IDatabase {
  public users!: IRepository<User>;
  public businesses!: IRepository<BusinessProfile>;
  public customers!: IRepository<Customer>;
  public products!: IRepository<Product>;
  public orders!: IRepository<Order>;
  public leads!: IRepository<Lead>;
  public settings!: IRepository<Setting>;
  public whatsappSessions!: IRepository<WhatsAppSession>;

  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private throttler = new GoogleSheetsThrottler();

  constructor(config: GoogleSheetsConfig) {
    this.spreadsheetId = config.spreadsheetId;

    let sa = (config.serviceAccountJson || "").trim();
    if (!sa.startsWith("{")) {
      try {
        sa = Buffer.from(sa, "base64").toString("utf-8");
      } catch {}
    }
    const credentials = JSON.parse(sa);

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.setupRepositories();
  }

  private setupRepositories() {
    this.users = new GoogleSheetsRepository<User>(
      this.sheets,
      this.spreadsheetId,
      "Users",
      ["id", "email", "passwordHash", "name", "role", "businessType", "createdAt", "updatedAt"],
      this.throttler
    );

    this.businesses = new GoogleSheetsRepository<BusinessProfile>(
      this.sheets,
      this.spreadsheetId,
      "Businesses",
      ["id", "userId", "name", "phone", "address", "settingsJson", "createdAt", "updatedAt"],
      this.throttler
    );

    this.customers = new GoogleSheetsRepository<Customer>(
      this.sheets,
      this.spreadsheetId,
      "Customers",
      ["id", "userId", "name", "phone", "email", "notes", "tags", "createdAt", "updatedAt"],
      this.throttler
    );

    this.products = new GoogleSheetsRepository<Product>(
      this.sheets,
      this.spreadsheetId,
      "Products",
      ["id", "userId", "name", "description", "price", "unit", "stock", "imageUrl", "createdAt", "updatedAt"],
      this.throttler
    );

    this.orders = new GoogleSheetsRepository<Order>(
      this.sheets,
      this.spreadsheetId,
      "Orders",
      ["id", "userId", "customerId", "customerName", "customerPhone", "itemsJson", "totalAmount", "status", "notes", "createdAt", "updatedAt"],
      this.throttler
    );

    this.leads = new GoogleSheetsRepository<Lead>(
      this.sheets,
      this.spreadsheetId,
      "Leads",
      ["id", "userId", "placeId", "name", "phone", "address", "website", "rating", "ratingCount", "category", "status", "notes", "createdAt", "updatedAt"],
      this.throttler
    );

    this.settings = new GoogleSheetsRepository<Setting>(
      this.sheets,
      this.spreadsheetId,
      "Settings",
      ["id", "userId", "key", "value", "createdAt", "updatedAt"],
      this.throttler
    );

    this.whatsappSessions = new GoogleSheetsRepository<WhatsAppSession>(
      this.sheets,
      this.spreadsheetId,
      "WhatsAppSessions",
      ["id", "userId", "status", "qrCode", "phoneNumber", "credentialsZip", "lastSeen", "createdAt", "updatedAt"],
      this.throttler
    );
  }

  async initializeSchema(): Promise<void> {
    try {
      const meta = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = (meta.data.sheets || []).map((s) => s.properties?.title || "");

      const schemas = [
        { name: "Users", headers: ["id", "email", "passwordHash", "name", "role", "businessType", "createdAt", "updatedAt"] },
        { name: "Businesses", headers: ["id", "userId", "name", "phone", "address", "settingsJson", "createdAt", "updatedAt"] },
        { name: "Customers", headers: ["id", "userId", "name", "phone", "email", "notes", "tags", "createdAt", "updatedAt"] },
        { name: "Products", headers: ["id", "userId", "name", "description", "price", "unit", "stock", "imageUrl", "createdAt", "updatedAt"] },
        { name: "Orders", headers: ["id", "userId", "customerId", "customerName", "customerPhone", "itemsJson", "totalAmount", "status", "notes", "createdAt", "updatedAt"] },
        { name: "Leads", headers: ["id", "userId", "placeId", "name", "phone", "address", "website", "rating", "ratingCount", "category", "status", "notes", "createdAt", "updatedAt"] },
        { name: "Settings", headers: ["id", "userId", "key", "value", "createdAt", "updatedAt"] },
        { name: "WhatsAppSessions", headers: ["id", "userId", "status", "qrCode", "phoneNumber", "credentialsZip", "lastSeen", "createdAt", "updatedAt"] },
      ];

      const requests: sheets_v4.Schema$Request[] = [];

      for (const schema of schemas) {
        if (!existingSheets.includes(schema.name)) {
          requests.push({
            addSheet: {
              properties: {
                title: schema.name,
                gridProperties: { rowCount: 1000, columnCount: 20 },
              },
            },
          });
        }
      }

      if (requests.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      // Initialize headers
      for (const schema of schemas) {
        const res = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${schema.name}!A1:Z1`,
        });
        if (!res.data.values || res.data.values.length === 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${schema.name}!A1`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [schema.headers],
            },
          });
        }
      }
    } catch (err: any) {
      console.warn("[GoogleSheetsDatabase] Schema auto-initialization skipped:", err.message);
    }
  }
}
