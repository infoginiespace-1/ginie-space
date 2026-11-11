export interface IRepository<T extends { id: string }> {
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filter?: Partial<T>): Promise<T[]>;
  findOne(filter: Partial<T>): Promise<T | null>;
  update(id: string, updates: Partial<Omit<T, "id" | "createdAt">>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDatabase {
  users: IRepository<import("../types").User>;
  businesses: IRepository<import("../types").BusinessProfile>;
  customers: IRepository<import("../types").Customer>;
  products: IRepository<import("../types").Product>;
  orders: IRepository<import("../types").Order>;
  leads: IRepository<import("../types").Lead>;
  settings: IRepository<import("../types").Setting>;
  whatsappSessions: IRepository<import("../types").WhatsAppSession>;
  initializeSchema(): Promise<void>;
}