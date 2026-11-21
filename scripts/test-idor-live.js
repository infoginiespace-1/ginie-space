const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");

/**
 * GinieSpace Real HTTP End-to-End IDOR & Multi-Tenant Isolation Test Suite
 * Spins up the real Express routes on an HTTP socket and dispatches actual HTTP requests.
 */

const JWT_SECRET = "test-jwt-secret-for-idor-live-verification-32chars";

// Mock Database with two distinct Tenants and their Staff
const mockDb = {
  users: {
    findById: async (id) => {
      const all = [
        { id: "usr_merchant_a", email: "merchanta@test.com", name: "Merchant A", role: "merchant" },
        { id: "usr_merchant_b", email: "merchantb@test.com", name: "Merchant B", role: "merchant" },
        { id: "usr_staff_a", email: "staffa@test.com", name: "Staff A (Cashier)", role: "staff", ownerId: "usr_merchant_a", staffPermissions: "orders,customers" },
        { id: "usr_staff_b", email: "staffb@test.com", name: "Staff B", role: "staff", ownerId: "usr_merchant_b", staffPermissions: "orders" },
      ];
      return all.find((u) => u.id === id) || null;
    },
    findMany: async (filter = {}) => {
      const all = [
        { id: "usr_merchant_a", email: "merchanta@test.com", name: "Merchant A", role: "merchant" },
        { id: "usr_merchant_b", email: "merchantb@test.com", name: "Merchant B", role: "merchant" },
        { id: "usr_staff_a", email: "staffa@test.com", name: "Staff A", role: "staff", ownerId: "usr_merchant_a" },
      ];
      if (filter.ownerId) return all.filter((u) => u.ownerId === filter.ownerId);
      return all;
    },
  },
  businesses: {
    findMany: async () => [
      { id: "biz_a", userId: "usr_merchant_a", name: "Store A", phone: "+919876543210", slug: "store-a" },
      { id: "biz_b", userId: "usr_merchant_b", name: "Store B", phone: "+919876543211", slug: "store-b" },
    ],
    findOne: async (filter) => {
      if (filter.userId) return { id: `biz_${filter.userId}`, userId: filter.userId, name: `Store ${filter.userId}` };
      if (filter.slug === "store-a") return { id: "biz_a", userId: "usr_merchant_a", name: "Store A", slug: "store-a" };
      return null;
    },
  },
  customers: {
    findById: async (id) => {
      if (id === "cust_b_999") return { id: "cust_b_999", userId: "usr_merchant_b", name: "Customer B Target", phone: "+919999999999" };
      if (id === "cust_a_111") return { id: "cust_a_111", userId: "usr_merchant_a", name: "Customer A", phone: "+919111111111" };
      return null;
    },
    findMany: async (filter = {}) => {
      if (filter.userId === "usr_merchant_a") return [{ id: "cust_a_111", userId: "usr_merchant_a", name: "Customer A" }];
      if (filter.userId === "usr_merchant_b") return [{ id: "cust_b_999", userId: "usr_merchant_b", name: "Customer B Target" }];
      return [];
    },
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => ({ id }),
  },
  orders: {
    findById: async (id) => {
      if (id === "ord_b_999") return { id: "ord_b_999", userId: "usr_merchant_b", customerName: "B Client", totalAmount: 500, status: "pending" };
      if (id === "ord_a_111") return { id: "ord_a_111", userId: "usr_merchant_a", customerName: "A Client", totalAmount: 200, status: "delivered" };
      return null;
    },
    findMany: async (filter = {}) => {
      if (filter.userId === "usr_merchant_a") return [{ id: "ord_a_111", userId: "usr_merchant_a", totalAmount: 200 }];
      return [];
    },
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => ({ id }),
  },
  products: {
    findById: async (id) => {
      if (id === "prod_b_999") return { id: "prod_b_999", userId: "usr_merchant_b", name: "Merchant B Secret Recipe", price: 100 };
      if (id === "prod_a_111") return { id: "prod_a_111", userId: "usr_merchant_a", name: "Merchant A Item", price: 50 };
      return null;
    },
    findMany: async (filter = {}) => {
      if (filter.userId === "usr_merchant_a") return [{ id: "prod_a_111", userId: "usr_merchant_a", name: "Item A" }];
      if (filter.userId === "usr_merchant_b") return [{ id: "prod_b_999", userId: "usr_merchant_b", name: "Item B" }];
      return [];
    },
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => ({ id }),
  },
  leads: {
    findById: async (id) => {
      if (id === "lead_b_999") return { id: "lead_b_999", userId: "usr_merchant_b", name: "Lead B Target" };
      return null;
    },
    findMany: async (filter = {}) => [],
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => ({ id }),
  },
  settings: {
    findOne: async () => null,
    findMany: async () => [],
    create: async () => ({ id: "s1" }),
    update: async () => ({ id: "s1" }),
    delete: async () => ({ id: "s1" }),
  },
  whatsappSessions: {
    findMany: async () => [],
    findOne: async () => null,
  },
  messages: {
    findMany: async (filter = {}) => {
      if (filter.userId === "usr_merchant_b") return [{ id: "msg_b", text: "Confidential order info" }];
      return [];
    },
  },
};

// Generate test tokens
const tokenMerchantA = jwt.sign({ id: "usr_merchant_a", email: "merchanta@test.com", role: "merchant" }, JWT_SECRET);
const tokenMerchantB = jwt.sign({ id: "usr_merchant_b", email: "merchantb@test.com", role: "merchant" }, JWT_SECRET);
const tokenStaffA = jwt.sign({ id: "usr_merchant_a", actorId: "usr_staff_a", email: "staffa@test.com", role: "staff", staffPermissions: ["orders", "customers"] }, JWT_SECRET);

const mockIo = { to: () => ({ emit: () => {} }) };
const mockWaManager = {
  getSessionState: () => ({ status: "connected", phone: "+919279259690" }),
  sendMessage: async () => true,
};

async function runTestSuite() {
  const { authMiddleware, requireAdmin } = require("../apps/api/dist/middleware/auth.js");
  const { createCustomersRouter } = require("../apps/api/dist/routes/customers.routes.js");
  const { createOrdersRouter } = require("../apps/api/dist/routes/orders.routes.js");
  const { createProductsRouter } = require("../apps/api/dist/routes/products.routes.js");
  const { createAdminRouter } = require("../apps/api/dist/routes/admin.routes.js");
  const { createSettingsRouter } = require("../apps/api/dist/routes/settings.routes.js");
  const { createStorefrontRouter } = require("../apps/api/dist/routes/storefront.routes.js");
  const { createWhatsAppRouter } = require("../apps/api/dist/routes/whatsapp.routes.js");

  const app = express();
  app.use(express.json());

  const auth = authMiddleware(JWT_SECRET);

  // Mount real routes identically to server.ts
  app.use("/api/customers", auth, createCustomersRouter(mockDb, mockIo));
  app.use("/api/orders", auth, createOrdersRouter(mockDb, mockIo, mockWaManager));
  app.use("/api/products", auth, createProductsRouter(mockDb, mockIo));
  app.use("/api/admin", auth, requireAdmin, createAdminRouter(mockDb, mockIo, mockWaManager));
  app.use("/api/settings", auth, createSettingsRouter(mockDb));
  app.use("/api/storefront", createStorefrontRouter(mockDb, mockIo));
  app.use("/api/whatsapp", auth, createWhatsAppRouter(mockWaManager, mockDb));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log("================================================================");
  console.log(`🌐 LIVE HTTP IDOR & ACCESS CONTROL TEST SUITE (Port: ${port})`);
  console.log("================================================================\n");

  const tests = [
    // 1. Single Resource Enumeration Obfuscation: Unauthorized reads must return 404 (NOT 403)
    {
      name: "Tenant A reads Tenant B Customer (anti-enumeration check)",
      url: `${baseUrl}/api/customers/cust_b_999`,
      method: "GET",
      token: tokenMerchantA,
      expectedStatus: 404,
      validate: (body) => body.error === "Customer not found",
    },
    {
      name: "Tenant A mutates Tenant B Customer details",
      url: `${baseUrl}/api/customers/cust_b_999`,
      method: "PUT",
      token: tokenMerchantA,
      body: { name: "Hacked Customer" },
      expectedStatus: 404,
      validate: (body) => body.error === "Customer not found",
    },
    {
      name: "Tenant A deletes Tenant B Customer",
      url: `${baseUrl}/api/customers/cust_b_999`,
      method: "DELETE",
      token: tokenMerchantA,
      expectedStatus: 404,
      validate: (body) => body.error === "Customer not found",
    },
    {
      name: "Tenant A reads Tenant B Customer Ledger",
      url: `${baseUrl}/api/customers/cust_b_999/ledger`,
      method: "GET",
      token: tokenMerchantA,
      expectedStatus: 404,
      validate: (body) => body.error === "Customer not found",
    },
    {
      name: "Tenant A reads Tenant B Order",
      url: `${baseUrl}/api/orders/ord_b_999`,
      method: "GET",
      token: tokenMerchantA,
      expectedStatus: 404,
      validate: (body) => body.error === "Order not found",
    },
    {
      name: "Tenant A mutates Tenant B Order Status",
      url: `${baseUrl}/api/orders/ord_b_999/status`,
      method: "PUT",
      token: tokenMerchantA,
      body: { status: "delivered" },
      expectedStatus: 404,
      validate: (body) => body.error === "Order not found",
    },
    {
      name: "Tenant A deletes Tenant B Product Item",
      url: `${baseUrl}/api/products/prod_b_999`,
      method: "DELETE",
      token: tokenMerchantA,
      expectedStatus: 404,
      validate: (body) => body.error === "Product not found",
    },

    // 2. Staff Isolation & Privilege Escalation Checks
    {
      name: "Staff A (belonging to Merchant A) attempts to access Tenant B Customer",
      url: `${baseUrl}/api/customers/cust_b_999`,
      method: "GET",
      token: tokenStaffA,
      expectedStatus: 404,
      validate: (body) => body.error === "Customer not found",
    },
    {
      name: "Staff A attempts to access Merchant Settings (Privilege Escalation)",
      url: `${baseUrl}/api/settings/staff`,
      method: "GET",
      token: tokenStaffA,
      expectedStatus: 403, // requireOwnerOrAdmin blocks staff
      validate: (body) => body.error && body.error.toLowerCase().includes("owner"),
    },
    {
      name: "Staff A attempts to delete Staff Account (Privilege Escalation)",
      url: `${baseUrl}/api/settings/staff/usr_staff_a`,
      method: "DELETE",
      token: tokenStaffA,
      expectedStatus: 403,
      validate: (body) => body.error && body.error.toLowerCase().includes("owner"),
    },

    // 3. Admin Route Protection from Merchants and Staff
    {
      name: "Merchant A calls Admin Merchants Directory",
      url: `${baseUrl}/api/admin/merchants`,
      method: "GET",
      token: tokenMerchantA,
      expectedStatus: 403,
      validate: (body) => body.error && (body.error.includes("permission") || body.error.includes("Administrator")),
    },
    {
      name: "Merchant A triggers Global WhatsApp Broadcast",
      url: `${baseUrl}/api/admin/whatsapp/broadcast`,
      method: "POST",
      token: tokenMerchantA,
      body: { messageText: "Spam broadcast" },
      expectedStatus: 403,
      validate: (body) => body.error && (body.error.includes("permission") || body.error.includes("Administrator")),
    },
    {
      name: "Staff A calls Admin Endpoint",
      url: `${baseUrl}/api/admin/merchants`,
      method: "GET",
      token: tokenStaffA,
      expectedStatus: 403,
      validate: (body) => body.error && (body.error.includes("permission") || body.error.includes("Administrator")),
    },

    // 4. Public Storefront Data Leakage Prevention
    {
      name: "Public Storefront does NOT leak Merchant passwordHash or private records",
      url: `${baseUrl}/api/storefront/demo`,
      method: "GET",
      token: null, // Unauthenticated public visitor
      expectedStatus: 200,
      validate: (body) => {
        const text = JSON.stringify(body);
        return !text.includes("passwordHash") && !text.includes("ownerId") && !text.includes("cust_b");
      },
    },

    // 5. Legitimate Authorized Access by Owner
    {
      name: "Tenant B legitimately reads own Customer",
      url: `${baseUrl}/api/customers/cust_b_999`,
      method: "GET",
      token: tokenMerchantB,
      expectedStatus: 200,
      validate: (body) => body.customer?.id === "cust_b_999",
    },
    {
      name: "Tenant A legitimately reads own Order",
      url: `${baseUrl}/api/orders/ord_a_111`,
      method: "GET",
      token: tokenMerchantA,
      expectedStatus: 200,
      validate: (body) => body.order?.id === "ord_a_111",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const headers = { "Content-Type": "application/json" };
    if (t.token) headers["Authorization"] = `Bearer ${t.token}`;

    try {
      const resp = await fetch(t.url, {
        method: t.method,
        headers,
        body: t.body ? JSON.stringify(t.body) : undefined,
      });

      const body = await resp.json().catch(() => ({}));
      const statusOk = resp.status === t.expectedStatus;
      const validOk = t.validate ? t.validate(body) : true;

      if (statusOk && validOk) {
        console.log(`✓ Test ${i + 1}: ${t.name} -> HTTP ${resp.status} (PASSED)`);
        passed++;
      } else {
        console.error(`✗ Test ${i + 1}: ${t.name} -> FAILED (Got HTTP ${resp.status}, Expected HTTP ${t.expectedStatus})`);
        console.error("  Response body:", body);
        failed++;
      }
    } catch (err) {
      console.error(`✗ Test ${i + 1}: ${t.name} -> ERROR: ${err.message}`);
      failed++;
    }
  }

  server.close();

  console.log("\n================================================================");
  console.log(`📊 TEST RESULTS: ${passed}/${tests.length} PASSED (${failed} failed)`);
  console.log("================================================================\n");

  if (failed > 0) process.exit(1);
}

runTestSuite().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
