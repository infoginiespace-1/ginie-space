import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IDatabase, Customer, Product, Order, ChatMessage } from "@giniespace/sheets-db";
import { createCustomersRouter } from "../apps/api/src/routes/customers.routes";
import { createProductsRouter } from "../apps/api/src/routes/products.routes";
import { createOrdersRouter } from "../apps/api/src/routes/orders.routes";
import { createWhatsAppRouter } from "../apps/api/src/routes/whatsapp.routes";
import { createSettingsRouter } from "../apps/api/src/routes/settings.routes";

/**
 * GinieSpace Automated Multi-Tenant IDOR Security Test Suite
 * Verifies that Tenant A CANNOT read, alter, or delete Tenant B's private data.
 */

const JWT_TEST_SECRET = "test-idor-secret-key-32-characters-min";

const TENANT_A = {
  id: "usr-tenant-a-111",
  email: "store-a@test.com",
  name: "Merchant Store A",
  role: "merchant",
  businessType: "retail" as const,
  plan: "free" as const,
};

const TENANT_B = {
  id: "usr-tenant-b-222",
  email: "store-b@test.com",
  name: "Merchant Store B",
  role: "merchant",
  businessType: "garments" as const,
  plan: "free" as const,
};

// Generate valid tokens
const tokenTenantA = jwt.sign(TENANT_A, JWT_TEST_SECRET);
const tokenTenantB = jwt.sign(TENANT_B, JWT_TEST_SECRET);

// In-memory mock repositories populated with Tenant B's private assets
const customersStore: Customer[] = [
  {
    id: "cust-b-001",
    userId: TENANT_B.id,
    name: "Tenant B Private Customer (Rahul Sharma)",
    phone: "+919876543210",
    email: "rahul@test.com",
    notes: "Confidential VIP customer of Store B",
    createdAt: new Date().toISOString(),
  },
];

const productsStore: Product[] = [
  {
    id: "prod-b-001",
    userId: TENANT_B.id,
    name: "Store B Designer Kurti",
    description: "Confidential margin pricing",
    price: 1999,
    costPrice: 850,
    unit: "pcs",
    stock: 25,
    category: "Garments",
    minOrderQty: 1,
    itemType: "product",
    createdAt: new Date().toISOString(),
  },
];

const ordersStore: Order[] = [
  {
    id: "ord-b-001",
    userId: TENANT_B.id,
    customerId: "cust-b-001",
    customerName: "Rahul Sharma",
    customerPhone: "+919876543210",
    itemsJson: JSON.stringify([{ productId: "prod-b-001", name: "Designer Kurti", quantity: 2, price: 1999 }]),
    totalAmount: 3998,
    status: "confirmed",
    paymentStatus: "paid",
    paidAmount: 3998,
    createdAt: new Date().toISOString(),
  },
];

const messagesStore: ChatMessage[] = [
  {
    id: "msg-b-001",
    userId: TENANT_B.id,
    contactPhone: "919876543210",
    contactName: "Rahul Sharma",
    text: "Store B private customer negotiation details",
    fromMe: "false",
    messageId: "msg-b-001",
    timestamp: new Date().toISOString(),
  },
  {
    id: "msg-a-001",
    userId: TENANT_A.id,
    contactPhone: "919999999999",
    contactName: "Customer A",
    text: "Store A message",
    fromMe: "true",
    messageId: "msg-a-001",
    timestamp: new Date().toISOString(),
  },
];

function createMockRepo<T extends { id: string }>(items: T[]) {
  return {
    findById: async (id: string): Promise<T | null> => {
      return items.find((i) => i.id === id) || null;
    },
    findMany: async (filter?: Partial<T>): Promise<T[]> => {
      if (!filter) return [...items];
      return items.filter((item) => {
        return Object.entries(filter).every(([k, v]) => (item as any)[k] === v);
      });
    },
    findOne: async (filter: Partial<T>): Promise<T | null> => {
      const match = items.find((item) => {
        return Object.entries(filter).every(([k, v]) => (item as any)[k] === v);
      });
      return match || null;
    },
    create: async (data: any): Promise<T> => {
      const newItem = { id: `item-${Date.now()}`, ...data };
      items.push(newItem);
      return newItem;
    },
    update: async (id: string, updates: any): Promise<T | null> => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...updates };
      return items[idx];
    },
    delete: async (id: string): Promise<boolean> => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return false;
      items.splice(idx, 1);
      return true;
    },
  };
}

const mockDb: IDatabase = {
  users: createMockRepo([
    { id: TENANT_A.id, email: TENANT_A.email, name: TENANT_A.name, role: "merchant", businessType: "retail", createdAt: "" },
    { id: TENANT_B.id, email: TENANT_B.email, name: TENANT_B.name, role: "merchant", businessType: "garments", createdAt: "" },
  ]),
  businesses: createMockRepo([
    { id: "biz-a", userId: TENANT_A.id, name: TENANT_A.name, phone: "919999999999", address: "Market A", createdAt: "" },
    { id: "biz-b", userId: TENANT_B.id, name: TENANT_B.name, phone: "919876543210", address: "Market B", createdAt: "" },
  ]),
  customers: createMockRepo(customersStore),
  products: createMockRepo(productsStore),
  orders: createMockRepo(ordersStore),
  leads: createMockRepo([]),
  settings: createMockRepo([]),
  whatsappSessions: createMockRepo([]),
  messages: createMockRepo(messagesStore),
  initializeSchema: async () => {},
};

// Mock Socket.io & WhatsApp Manager
const mockIo: any = { to: () => ({ emit: () => {} }) };
const mockWaManager: any = {
  getSessionState: () => ({ status: "connected" }),
  sendMessage: async () => ({ key: { id: "mock_id" } }),
};

const app = express();
app.use(express.json());

// Auth middleware simulator
app.use((req: any, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_TEST_SECRET);
      req.user = decoded;
    } catch {}
  }
  next();
});

// Mount routes
app.use("/api/customers", createCustomersRouter(mockDb, mockIo));
app.use("/api/products", createProductsRouter(mockDb, mockIo));
app.use("/api/orders", createOrdersRouter(mockDb, mockIo, mockWaManager));
app.use("/api/whatsapp", createWhatsAppRouter(mockWaManager, mockDb));
app.use("/api/settings", createSettingsRouter(mockDb));

interface TestResult {
  testId: string;
  name: string;
  attackVector: string;
  expectedStatus: number;
  actualStatus: number;
  status: "PASS" | "FAIL";
  notes: string;
}

const results: TestResult[] = [];

async function runTestSuite() {
  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log("==================================================================");
  console.log("🛡️  GINIESPACE MULTI-TENANT IDOR SECURITY VERIFICATION TEST");
  console.log("    Attacker: Tenant A (Kirana Store A)");
  console.log("    Target:   Tenant B (Fashion Hub B)");
  console.log(`    Test Server: ${baseUrl}`);
  console.log("==================================================================");

  async function testHttp(method: string, endpoint: string, token: string, body?: any) {
    const opts: RequestInit = {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${baseUrl}${endpoint}`, opts);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { status: res.status, body: data };
  }

  try {
    // Test 1: Tenant A tries to read Tenant B's Customer
    const t1 = await testHttp("GET", "/api/customers/cust-b-001", tokenTenantA);
    results.push({
      testId: "IDOR-01",
      name: "Cross-Tenant Customer Access",
      attackVector: "Tenant A requesting /api/customers/cust-b-001",
      expectedStatus: 403,
      actualStatus: t1.status,
      status: t1.status === 403 ? "PASS" : "FAIL",
      notes: t1.body?.error || "Access blocked",
    });

    // Test 2: Tenant A tries to read Tenant B's Customer Ledger
    const t2 = await testHttp("GET", "/api/customers/cust-b-001/ledger", tokenTenantA);
    results.push({
      testId: "IDOR-02",
      name: "Cross-Tenant Customer Ledger Access",
      attackVector: "Tenant A requesting /api/customers/cust-b-001/ledger",
      expectedStatus: 403,
      actualStatus: t2.status,
      status: t2.status === 403 ? "PASS" : "FAIL",
      notes: t2.body?.error || "Ledger access blocked",
    });

    // Test 3: Tenant A tries to update Tenant B's Customer details
    const t3 = await testHttp("PUT", "/api/customers/cust-b-001", tokenTenantA, { name: "Hijacked Name" });
    results.push({
      testId: "IDOR-03",
      name: "Cross-Tenant Customer Modification",
      attackVector: "Tenant A modifying /api/customers/cust-b-001",
      expectedStatus: 403,
      actualStatus: t3.status,
      status: t3.status === 403 ? "PASS" : "FAIL",
      notes: t3.body?.error || "Modification blocked",
    });

    // Test 4: Tenant A tries to delete Tenant B's Customer
    const t4 = await testHttp("DELETE", "/api/customers/cust-b-001", tokenTenantA);
    results.push({
      testId: "IDOR-04",
      name: "Cross-Tenant Customer Deletion",
      attackVector: "Tenant A deleting /api/customers/cust-b-001",
      expectedStatus: 403,
      actualStatus: t4.status,
      status: t4.status === 403 ? "PASS" : "FAIL",
      notes: t4.body?.error || "Deletion blocked",
    });

    // Test 5: Tenant A tries to view Tenant B's Order
    const t5 = await testHttp("GET", "/api/orders/ord-b-001", tokenTenantA);
    results.push({
      testId: "IDOR-05",
      name: "Cross-Tenant Order Inspection",
      attackVector: "Tenant A requesting /api/orders/ord-b-001",
      expectedStatus: 403,
      actualStatus: t5.status,
      status: t5.status === 403 ? "PASS" : "FAIL",
      notes: t5.body?.error || "Order access blocked",
    });

    // Test 6: Tenant A tries to change Tenant B's Order Status
    const t6 = await testHttp("PUT", "/api/orders/ord-b-001/status", tokenTenantA, { status: "cancelled" });
    results.push({
      testId: "IDOR-06",
      name: "Cross-Tenant Order Status Tampering",
      attackVector: "Tenant A altering /api/orders/ord-b-001/status",
      expectedStatus: 403,
      actualStatus: t6.status,
      status: t6.status === 403 ? "PASS" : "FAIL",
      notes: t6.body?.error || "Status tampering blocked",
    });

    // Test 7: Tenant A tries to view Tenant B's Product
    const t7 = await testHttp("GET", "/api/products/prod-b-001", tokenTenantA);
    results.push({
      testId: "IDOR-07",
      name: "Cross-Tenant Product Inspection",
      attackVector: "Tenant A requesting /api/products/prod-b-001",
      expectedStatus: 403,
      actualStatus: t7.status,
      status: t7.status === 403 ? "PASS" : "FAIL",
      notes: t7.body?.error || "Product access blocked",
    });

    // Test 8: Tenant A tries to modify Tenant B's Product / Pricing
    const t8 = await testHttp("PUT", "/api/products/prod-b-001", tokenTenantA, { price: 1 });
    results.push({
      testId: "IDOR-08",
      name: "Cross-Tenant Product Price Tampering",
      attackVector: "Tenant A altering price on /api/products/prod-b-001",
      expectedStatus: 403,
      actualStatus: t8.status,
      status: t8.status === 403 ? "PASS" : "FAIL",
      notes: t8.body?.error || "Price tampering blocked",
    });

    // Test 9: Tenant A tries to delete Tenant B's Product
    const t9 = await testHttp("DELETE", "/api/products/prod-b-001", tokenTenantA);
    results.push({
      testId: "IDOR-09",
      name: "Cross-Tenant Product Deletion",
      attackVector: "Tenant A deleting /api/products/prod-b-001",
      expectedStatus: 403,
      actualStatus: t9.status,
      status: t9.status === 403 ? "PASS" : "FAIL",
      notes: t9.body?.error || "Deletion blocked",
    });

    // Test 10: Tenant A requests WhatsApp chat history (Must NOT leak Tenant B's messages)
    const t10 = await testHttp("GET", "/api/whatsapp/messages", tokenTenantA);
    const leakedTenantBMessages = (t10.body?.messages || []).filter((m: any) => m.userId === TENANT_B.id);
    const isZeroLeak = t10.status === 200 && leakedTenantBMessages.length === 0;
    results.push({
      testId: "IDOR-10",
      name: "WhatsApp Chat Cross-Tenant Leakage Check",
      attackVector: "Tenant A querying /api/whatsapp/messages",
      expectedStatus: 200,
      actualStatus: t10.status,
      status: isZeroLeak ? "PASS" : "FAIL",
      notes: isZeroLeak ? "Zero messages leaked. Strictly scoped to Tenant A." : "VULNERABILITY: Leaked messages!",
    });

    // Test 11: Tenant B accessing their OWN Customer (Legitimate check)
    const t11 = await testHttp("GET", "/api/customers/cust-b-001", tokenTenantB);
    results.push({
      testId: "IDOR-11",
      name: "Legitimate Tenant B Self-Access",
      attackVector: "Tenant B legitimately accessing /api/customers/cust-b-001",
      expectedStatus: 200,
      actualStatus: t11.status,
      status: t11.status === 200 ? "PASS" : "FAIL",
      notes: "Allowed successfully (HTTP 200)",
    });

    // Output formatting
    console.log("\nIDOR Security Test Results:\n");
    console.table(
      results.map((r) => ({
        "Test ID": r.testId,
        "Scenario": r.name,
        "Expected": r.expectedStatus,
        "Actual": r.actualStatus,
        "Result": r.status === "PASS" ? "✅ PASS" : "❌ FAIL",
        "Notes": r.notes,
      }))
    );

    const failed = results.filter((r) => r.status === "FAIL");
    if (failed.length > 0) {
      console.error(`\n❌ ${failed.length} IDOR tests FAILED!`);
      process.exit(1);
    } else {
      console.log(`\n✅ ALL 11 IDOR TESTS PASSED! Multi-tenant boundary is 100% strictly enforced.`);
    }
  } finally {
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
