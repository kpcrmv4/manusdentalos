// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, or, like, desc, asc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productCode: varchar("productCode", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  refCode: varchar("refCode", { length: 100 }),
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }),
  size: varchar("size", { length: 100 }),
  categoryId: int("categoryId").references(() => categories.id),
  unit: varchar("unit", { length: 50 }).notNull().default("\u0E0A\u0E34\u0E49\u0E19"),
  minStockLevel: int("minStockLevel").default(0),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id)
}, (table) => ({
  productCodeIdx: index("productCode_idx").on(table.productCode),
  refCodeIdx: index("refCode_idx").on(table.refCode),
  nameIdx: index("name_idx").on(table.name)
}));
var suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  leadTimeDays: int("leadTimeDays").default(7),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var inventoryLots = mysqlTable("inventoryLots", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  lotNumber: varchar("lotNumber", { length: 100 }).notNull(),
  expiryDate: timestamp("expiryDate"),
  physicalQty: decimal("physicalQty", { precision: 10, scale: 2 }).notNull().default("0"),
  availableQty: decimal("availableQty", { precision: 10, scale: 2 }).notNull().default("0"),
  reservedQty: decimal("reservedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
  supplierId: int("supplierId").references(() => suppliers.id),
  invoiceNo: varchar("invoiceNo", { length: 100 }),
  refCode: varchar("refCode", { length: 100 }),
  receivedDate: timestamp("receivedDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  productIdIdx: index("productId_idx").on(table.productId),
  lotNumberIdx: index("lotNumber_idx").on(table.lotNumber),
  expiryDateIdx: index("expiryDate_idx").on(table.expiryDate)
}));
var purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 100 }).notNull().unique(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  status: mysqlEnum("status", ["pending", "partially_received", "completed", "cancelled"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  poNumberIdx: index("poNumber_idx").on(table.poNumber),
  statusIdx: index("status_idx").on(table.status)
}));
var purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("poId").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id),
  orderedQty: decimal("orderedQty", { precision: 10, scale: 2 }).notNull(),
  receivedQty: decimal("receivedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  lotId: int("lotId").notNull().references(() => inventoryLots.id),
  reservedQty: decimal("reservedQty", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "committed", "cancelled"]).default("active").notNull(),
  reservedBy: int("reservedBy").notNull().references(() => users.id),
  reservedFor: varchar("reservedFor", { length: 500 }),
  patientName: varchar("patientName", { length: 255 }),
  surgeryDate: timestamp("surgeryDate"),
  expiresAt: timestamp("expiresAt"),
  committedAt: timestamp("committedAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  lotIdIdx: index("lotId_idx").on(table.lotId),
  statusIdx: index("status_idx").on(table.status),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate)
}));
var usageLogs = mysqlTable("usageLogs", {
  id: int("id").autoincrement().primaryKey(),
  lotId: int("lotId").notNull().references(() => inventoryLots.id),
  reservationId: int("reservationId").references(() => reservations.id),
  usedQty: decimal("usedQty", { precision: 10, scale: 2 }).notNull(),
  patientName: varchar("patientName", { length: 255 }),
  surgeryDate: timestamp("surgeryDate"),
  photoEvidence: text("photoEvidence"),
  notes: text("notes"),
  loggedBy: int("loggedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  lotIdIdx: index("lotId_idx").on(table.lotId),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate)
}));
var auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  tableName: varchar("tableName", { length: 100 }).notNull(),
  recordId: int("recordId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  oldValues: text("oldValues"),
  newValues: text("newValues"),
  userId: int("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  tableNameIdx: index("tableName_idx").on(table.tableName),
  recordIdIdx: index("recordId_idx").on(table.recordId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt)
}));
var notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["low_stock", "expiring_soon", "expired", "pending_order", "slow_moving"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message").notNull(),
  relatedTable: varchar("relatedTable", { length: 100 }),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false).notNull(),
  userId: int("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  isReadIdx: index("isRead_idx").on(table.isRead),
  userIdIdx: index("userId_idx").on(table.userId)
}));
var surgeryCases = mysqlTable("surgeryCases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).notNull().unique(),
  patientName: varchar("patientName", { length: 255 }).notNull(),
  patientId: varchar("patientId", { length: 100 }),
  surgeryDate: timestamp("surgeryDate").notNull(),
  surgeryType: varchar("surgeryType", { length: 255 }),
  dentistName: varchar("dentistName", { length: 255 }),
  status: mysqlEnum("status", ["planned", "materials_ready", "materials_partial", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
  materialStatus: mysqlEnum("materialStatus", ["green", "yellow", "red"]).default("red").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  caseNumberIdx: index("caseNumber_idx").on(table.caseNumber),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate),
  statusIdx: index("status_idx").on(table.status)
}));
var surgeryCaseMaterials = mysqlTable("surgeryCaseMaterials", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull().references(() => surgeryCases.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id),
  requiredQty: decimal("requiredQty", { precision: 10, scale: 2 }).notNull(),
  reservedQty: decimal("reservedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  usedQty: decimal("usedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  status: mysqlEnum("status", ["pending", "reserved", "used"]).default("pending").notNull(),
  reservationId: int("reservationId").references(() => reservations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId)
}));
var productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  inventoryLots: many(inventoryLots)
}));
var inventoryLotsRelations = relations(inventoryLots, ({ one, many }) => ({
  product: one(products, {
    fields: [inventoryLots.productId],
    references: [products.id]
  }),
  supplier: one(suppliers, {
    fields: [inventoryLots.supplierId],
    references: [suppliers.id]
  }),
  reservations: many(reservations),
  usageLogs: many(usageLogs)
}));
var purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id]
  }),
  items: many(purchaseOrderItems),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id]
  })
}));
var purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.poId],
    references: [purchaseOrders.id]
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id]
  })
}));
var reservationsRelations = relations(reservations, ({ one }) => ({
  lot: one(inventoryLots, {
    fields: [reservations.lotId],
    references: [inventoryLots.id]
  }),
  reservedByUser: one(users, {
    fields: [reservations.reservedBy],
    references: [users.id]
  })
}));
var usageLogsRelations = relations(usageLogs, ({ one }) => ({
  lot: one(inventoryLots, {
    fields: [usageLogs.lotId],
    references: [inventoryLots.id]
  }),
  reservation: one(reservations, {
    fields: [usageLogs.reservationId],
    references: [reservations.id]
  }),
  loggedByUser: one(users, {
    fields: [usageLogs.loggedBy],
    references: [users.id]
  })
}));
var surgeryCasesRelations = relations(surgeryCases, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [surgeryCases.createdBy],
    references: [users.id]
  }),
  materials: many(surgeryCaseMaterials)
}));
var surgeryCaseMaterialsRelations = relations(surgeryCaseMaterials, ({ one }) => ({
  surgeryCase: one(surgeryCases, {
    fields: [surgeryCaseMaterials.caseId],
    references: [surgeryCases.id]
  }),
  product: one(products, {
    fields: [surgeryCaseMaterials.productId],
    references: [products.id]
  }),
  reservation: one(reservations, {
    fields: [surgeryCaseMaterials.reservationId],
    references: [reservations.id]
  })
}));
var pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id]
  })
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).orderBy(asc(categories.name));
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}
async function searchProducts(query) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  return await db.select().from(products).where(
    or(
      like(products.productCode, searchPattern),
      like(products.name, searchPattern),
      like(products.refCode, searchPattern),
      like(products.brand, searchPattern),
      like(products.model, searchPattern)
    )
  ).limit(20);
}
async function getProductById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}
async function getProductByCode(productCode) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(products).where(eq(products.productCode, productCode)).limit(1);
  return result[0];
}
async function getAllProducts(categoryId) {
  const db = await getDb();
  if (!db) return [];
  if (categoryId) {
    return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(asc(products.name));
  }
  return await db.select().from(products).orderBy(asc(products.name));
}
async function createProduct(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result;
}
async function updateProduct(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}
async function getAllSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
}
async function getSupplierById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}
async function createSupplier(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return result;
}
async function getAllInventoryLots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryLots).orderBy(asc(inventoryLots.expiryDate));
}
async function getInventoryLotsByProduct(productId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryLots).where(eq(inventoryLots.productId, productId)).orderBy(asc(inventoryLots.expiryDate));
}
async function getAvailableLotsFEFO(productId, requiredQty) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryLots).where(
    and(
      eq(inventoryLots.productId, productId),
      sql`${inventoryLots.availableQty} > 0`
    )
  ).orderBy(asc(inventoryLots.expiryDate));
}
async function createInventoryLot(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    ...data,
    physicalQty: data.physicalQty.toString(),
    availableQty: data.availableQty.toString(),
    reservedQty: "0",
    costPrice: data.costPrice?.toString()
  };
  const result = await db.insert(inventoryLots).values(values);
  return result;
}
async function updateInventoryLot(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventoryLots).set(data).where(eq(inventoryLots.id, id));
}
async function createReservation(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    ...data,
    reservedQty: data.reservedQty.toString()
  };
  const result = await db.insert(reservations).values(values);
  return result;
}
async function getReservationById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result[0];
}
async function updateReservation(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reservations).set(data).where(eq(reservations.id, id));
}
async function getAllPurchaseOrders(status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return await db.select().from(purchaseOrders).where(eq(purchaseOrders.status, status)).orderBy(desc(purchaseOrders.orderDate));
  }
  return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate));
}
async function getPurchaseOrderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}
async function createPurchaseOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    ...data,
    totalAmount: data.totalAmount?.toString()
  };
  const result = await db.insert(purchaseOrders).values(values);
  return result;
}
async function getPurchaseOrderItems(poId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId));
}
async function createPurchaseOrderItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    ...data,
    orderedQty: data.orderedQty.toString(),
    receivedQty: "0",
    unitPrice: data.unitPrice?.toString(),
    totalPrice: data.totalPrice?.toString()
  };
  const result = await db.insert(purchaseOrderItems).values(values);
  return result;
}
async function createAuditLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(data);
  return result;
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result;
}
async function getUserNotifications(userId, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (unreadOnly) {
    return await db.select().from(notifications).where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    ).orderBy(desc(notifications.createdAt));
  }
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
async function markNotificationAsRead(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    product: products,
    totalAvailable: sql`SUM(${inventoryLots.availableQty})`
  }).from(products).leftJoin(inventoryLots, eq(products.id, inventoryLots.productId)).groupBy(products.id).having(sql`SUM(${inventoryLots.availableQty}) < ${products.minStockLevel}`);
  return result;
}
async function getExpiringSoonLots(daysAhead = 30) {
  const db = await getDb();
  if (!db) return [];
  const futureDate = /* @__PURE__ */ new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  return await db.select().from(inventoryLots).where(
    and(
      sql`${inventoryLots.expiryDate} IS NOT NULL`,
      lte(inventoryLots.expiryDate, futureDate),
      gte(inventoryLots.expiryDate, /* @__PURE__ */ new Date()),
      sql`${inventoryLots.availableQty} > 0`
    )
  ).orderBy(asc(inventoryLots.expiryDate));
}
async function getAllSurgeryCases(filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(surgeryCases);
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(surgeryCases.surgeryDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(surgeryCases.surgeryDate, filters.endDate));
  }
  if (filters?.status) {
    conditions.push(eq(surgeryCases.status, filters.status));
  }
  if (conditions.length > 0) {
    return await db.select().from(surgeryCases).where(and(...conditions)).orderBy(asc(surgeryCases.surgeryDate));
  }
  return await db.select().from(surgeryCases).orderBy(asc(surgeryCases.surgeryDate));
}
async function getSurgeryCaseById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(surgeryCases).where(eq(surgeryCases.id, id)).limit(1);
  return result[0];
}
async function getSurgeryCaseByNumber(caseNumber) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(surgeryCases).where(eq(surgeryCases.caseNumber, caseNumber)).limit(1);
  return result[0];
}
async function createSurgeryCase(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(surgeryCases).values(data);
  return result;
}
async function updateSurgeryCase(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(surgeryCases).set(data).where(eq(surgeryCases.id, id));
}
async function getSurgeryCaseMaterials(caseId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surgeryCaseMaterials).where(eq(surgeryCaseMaterials.caseId, caseId));
}
async function addSurgeryCaseMaterial(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    ...data,
    requiredQty: data.requiredQty.toString(),
    reservedQty: "0",
    usedQty: "0"
  };
  const result = await db.insert(surgeryCaseMaterials).values(values);
  return result;
}
async function updateSurgeryCaseMaterial(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(surgeryCaseMaterials).set(data).where(eq(surgeryCaseMaterials.id, id));
}
async function calculateCaseMaterialStatus(caseId) {
  const db = await getDb();
  if (!db) return "red";
  const materials = await getSurgeryCaseMaterials(caseId);
  if (materials.length === 0) return "red";
  let allReserved = true;
  let someReserved = false;
  for (const material of materials) {
    const reserved = parseFloat(material.reservedQty || "0");
    const required = parseFloat(material.requiredQty || "0");
    if (reserved >= required) {
      someReserved = true;
    } else {
      allReserved = false;
    }
  }
  if (allReserved) return "green";
  if (someReserved) return "yellow";
  return "red";
}
async function savePushSubscription(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint)).limit(1);
  if (existing.length > 0) {
    await db.update(pushSubscriptions).set({ isActive: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0];
  }
  const result = await db.insert(pushSubscriptions).values(data);
  return result;
}
async function deletePushSubscription(endpoint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pushSubscriptions).set({ isActive: false }).where(eq(pushSubscriptions.endpoint, endpoint));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // ==================== Categories ====================
  categories: router({
    list: protectedProcedure.query(async () => {
      return await getAllCategories();
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      description: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      await createCategory(input);
      await createAuditLog({
        tableName: "categories",
        recordId: 0,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  // ==================== Products ====================
  products: router({
    search: protectedProcedure.input(z2.object({ query: z2.string() })).query(async ({ input }) => {
      return await searchProducts(input.query);
    }),
    list: protectedProcedure.input(z2.object({ categoryId: z2.number().optional() }).optional()).query(async ({ input }) => {
      return await getAllProducts(input?.categoryId);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await getProductById(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      productCode: z2.string().min(1),
      name: z2.string().min(1),
      refCode: z2.string().optional(),
      brand: z2.string().optional(),
      model: z2.string().optional(),
      size: z2.string().optional(),
      categoryId: z2.number().optional(),
      unit: z2.string().default("\u0E0A\u0E34\u0E49\u0E19"),
      minStockLevel: z2.number().default(0),
      description: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const existing = await getProductByCode(input.productCode);
      if (existing) {
        throw new Error("\u0E23\u0E2B\u0E31\u0E2A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E19\u0E35\u0E49\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E25\u0E49\u0E27");
      }
      await createProduct({
        ...input,
        createdBy: ctx.user.id
      });
      await createAuditLog({
        tableName: "products",
        recordId: 0,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      productCode: z2.string().optional(),
      name: z2.string().optional(),
      refCode: z2.string().optional(),
      brand: z2.string().optional(),
      model: z2.string().optional(),
      size: z2.string().optional(),
      categoryId: z2.number().optional(),
      unit: z2.string().optional(),
      minStockLevel: z2.number().optional(),
      description: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const oldProduct = await getProductById(id);
      await updateProduct(id, updateData);
      await createAuditLog({
        tableName: "products",
        recordId: id,
        action: "update",
        oldValues: JSON.stringify(oldProduct),
        newValues: JSON.stringify(updateData),
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  // ==================== Suppliers ====================
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await getAllSuppliers();
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await getSupplierById(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      code: z2.string().min(1),
      name: z2.string().min(1),
      contactPerson: z2.string().optional(),
      phone: z2.string().optional(),
      email: z2.string().email().optional(),
      address: z2.string().optional(),
      leadTimeDays: z2.number().default(7)
    })).mutation(async ({ input, ctx }) => {
      await createSupplier(input);
      await createAuditLog({
        tableName: "suppliers",
        recordId: 0,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  // ==================== Inventory Lots ====================
  inventory: router({
    list: protectedProcedure.query(async () => {
      return await getAllInventoryLots();
    }),
    getLotsByProduct: protectedProcedure.input(z2.object({ productId: z2.number() })).query(async ({ input }) => {
      return await getInventoryLotsByProduct(input.productId);
    }),
    getAvailableLotsFEFO: protectedProcedure.input(z2.object({
      productId: z2.number(),
      requiredQty: z2.number()
    })).query(async ({ input }) => {
      return await getAvailableLotsFEFO(input.productId, input.requiredQty);
    }),
    createLot: protectedProcedure.input(z2.object({
      productId: z2.number(),
      lotNumber: z2.string().min(1),
      expiryDate: z2.date().optional(),
      physicalQty: z2.number(),
      costPrice: z2.number().optional(),
      supplierId: z2.number().optional(),
      invoiceNo: z2.string().optional(),
      refCode: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      await createInventoryLot({
        ...input,
        availableQty: input.physicalQty
      });
      await createAuditLog({
        tableName: "inventoryLots",
        recordId: 0,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true };
    }),
    getLowStock: protectedProcedure.query(async () => {
      return await getLowStockProducts();
    }),
    getExpiringSoon: protectedProcedure.input(z2.object({ daysAhead: z2.number().default(30) })).query(async ({ input }) => {
      return await getExpiringSoonLots(input.daysAhead);
    })
  }),
  // ==================== Reservations ====================
  reservations: router({
    create: protectedProcedure.input(z2.object({
      lotId: z2.number(),
      reservedQty: z2.number(),
      reservedFor: z2.string().optional(),
      patientName: z2.string().optional(),
      surgeryDate: z2.date().optional(),
      expiresAt: z2.date().optional()
    })).mutation(async ({ input, ctx }) => {
      const lot = await getInventoryLotsByProduct(0).then(
        (lots) => lots.find((l) => l.id === input.lotId)
      );
      if (!lot) {
        throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Lot \u0E19\u0E35\u0E49");
      }
      const availableQty = parseFloat(lot.availableQty);
      if (availableQty < input.reservedQty) {
        throw new Error(`\u0E08\u0E33\u0E19\u0E27\u0E19\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E1E\u0E2D (\u0E40\u0E2B\u0E25\u0E37\u0E2D ${availableQty} ${lot.productId})`);
      }
      await createReservation({
        ...input,
        reservedBy: ctx.user.id
      });
      const newAvailableQty = availableQty - input.reservedQty;
      const newReservedQty = parseFloat(lot.reservedQty) + input.reservedQty;
      await updateInventoryLot(input.lotId, {
        availableQty: newAvailableQty.toString(),
        reservedQty: newReservedQty.toString()
      });
      await createAuditLog({
        tableName: "reservations",
        recordId: 0,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true };
    }),
    commit: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const reservation = await getReservationById(input.id);
      if (!reservation) {
        throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Reservation \u0E19\u0E35\u0E49");
      }
      if (reservation.status !== "active") {
        throw new Error("Reservation \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16 commit \u0E44\u0E14\u0E49");
      }
      await updateReservation(input.id, {
        status: "committed",
        committedAt: /* @__PURE__ */ new Date()
      });
      const lot = await getInventoryLotsByProduct(0).then(
        (lots) => lots.find((l) => l.id === reservation.lotId)
      );
      if (lot) {
        const newReservedQty = parseFloat(lot.reservedQty) - parseFloat(reservation.reservedQty);
        const newPhysicalQty = parseFloat(lot.physicalQty) - parseFloat(reservation.reservedQty);
        await updateInventoryLot(reservation.lotId, {
          reservedQty: newReservedQty.toString(),
          physicalQty: newPhysicalQty.toString()
        });
      }
      await createAuditLog({
        tableName: "reservations",
        recordId: input.id,
        action: "update",
        oldValues: JSON.stringify(reservation),
        newValues: JSON.stringify({ status: "committed" }),
        userId: ctx.user.id
      });
      return { success: true };
    }),
    cancel: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const reservation = await getReservationById(input.id);
      if (!reservation) {
        throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Reservation \u0E19\u0E35\u0E49");
      }
      if (reservation.status !== "active") {
        throw new Error("Reservation \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E14\u0E49");
      }
      await updateReservation(input.id, {
        status: "cancelled",
        cancelledAt: /* @__PURE__ */ new Date()
      });
      const lot = await getInventoryLotsByProduct(0).then(
        (lots) => lots.find((l) => l.id === reservation.lotId)
      );
      if (lot) {
        const newAvailableQty = parseFloat(lot.availableQty) + parseFloat(reservation.reservedQty);
        const newReservedQty = parseFloat(lot.reservedQty) - parseFloat(reservation.reservedQty);
        await updateInventoryLot(reservation.lotId, {
          availableQty: newAvailableQty.toString(),
          reservedQty: newReservedQty.toString()
        });
      }
      await createAuditLog({
        tableName: "reservations",
        recordId: input.id,
        action: "update",
        oldValues: JSON.stringify(reservation),
        newValues: JSON.stringify({ status: "cancelled" }),
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  // ==================== Purchase Orders ====================
  purchaseOrders: router({
    list: protectedProcedure.input(z2.object({ status: z2.string().optional() }).optional()).query(async ({ input }) => {
      return await getAllPurchaseOrders(input?.status);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const po = await getPurchaseOrderById(input.id);
      if (!po) return null;
      const items = await getPurchaseOrderItems(input.id);
      return { ...po, items };
    }),
    create: protectedProcedure.input(z2.object({
      poNumber: z2.string().min(1),
      supplierId: z2.number(),
      expectedDeliveryDate: z2.date().optional(),
      notes: z2.string().optional(),
      items: z2.array(z2.object({
        productId: z2.number(),
        orderedQty: z2.number(),
        unitPrice: z2.number().optional()
      }))
    })).mutation(async ({ input, ctx }) => {
      const { items, ...poData } = input;
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.unitPrice || 0) * item.orderedQty;
      }, 0);
      await createPurchaseOrder({
        ...poData,
        totalAmount,
        createdBy: ctx.user.id
      });
      const createdPO = await getAllPurchaseOrders();
      const poId = createdPO[0]?.id || 0;
      for (const item of items) {
        await createPurchaseOrderItem({
          poId,
          productId: item.productId,
          orderedQty: item.orderedQty,
          unitPrice: item.unitPrice,
          totalPrice: (item.unitPrice || 0) * item.orderedQty
        });
      }
      await createAuditLog({
        tableName: "purchaseOrders",
        recordId: poId,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true, poId };
    })
  }),
  // ==================== Notifications ====================
  notifications: router({
    list: protectedProcedure.input(z2.object({ unreadOnly: z2.boolean().default(false) })).query(async ({ ctx, input }) => {
      return await getUserNotifications(ctx.user.id, input.unreadOnly);
    }),
    markAsRead: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await markNotificationAsRead(input.id);
      return { success: true };
    }),
    create: protectedProcedure.input(z2.object({
      type: z2.enum(["low_stock", "expiring_soon", "expired", "pending_order", "slow_moving"]),
      title: z2.string(),
      message: z2.string(),
      relatedTable: z2.string().optional(),
      relatedId: z2.number().optional()
    })).mutation(async ({ input, ctx }) => {
      await createNotification({
        ...input,
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  // ==================== Surgery Cases ====================
  surgeryCases: router({
    list: protectedProcedure.input(z2.object({
      startDate: z2.date().optional(),
      endDate: z2.date().optional(),
      status: z2.string().optional()
    }).optional()).query(async ({ input }) => {
      return await getAllSurgeryCases(input);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const surgeryCase = await getSurgeryCaseById(input.id);
      if (!surgeryCase) return null;
      const materials = await getSurgeryCaseMaterials(input.id);
      return { ...surgeryCase, materials };
    }),
    create: protectedProcedure.input(z2.object({
      caseNumber: z2.string().min(1),
      patientName: z2.string().min(1),
      patientId: z2.string().optional(),
      surgeryDate: z2.date(),
      surgeryType: z2.string().optional(),
      dentistName: z2.string().optional(),
      notes: z2.string().optional(),
      materials: z2.array(z2.object({
        productId: z2.number(),
        requiredQty: z2.number()
      })).optional()
    })).mutation(async ({ input, ctx }) => {
      const { materials, ...caseData } = input;
      await createSurgeryCase({
        ...caseData,
        createdBy: ctx.user.id
      });
      const createdCase = await getSurgeryCaseByNumber(input.caseNumber);
      const caseId = createdCase?.id || 0;
      if (materials && materials.length > 0) {
        for (const material of materials) {
          await addSurgeryCaseMaterial({
            caseId,
            productId: material.productId,
            requiredQty: material.requiredQty
          });
        }
      }
      const materialStatus = await calculateCaseMaterialStatus(caseId);
      await updateSurgeryCase(caseId, { materialStatus });
      await createAuditLog({
        tableName: "surgeryCases",
        recordId: caseId,
        action: "create",
        newValues: JSON.stringify(input),
        userId: ctx.user.id
      });
      return { success: true, caseId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      patientName: z2.string().optional(),
      patientId: z2.string().optional(),
      surgeryDate: z2.date().optional(),
      surgeryType: z2.string().optional(),
      dentistName: z2.string().optional(),
      status: z2.enum(["planned", "materials_ready", "materials_partial", "in_progress", "completed", "cancelled"]).optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateSurgeryCase(id, data);
      await createAuditLog({
        tableName: "surgeryCases",
        recordId: id,
        action: "update",
        newValues: JSON.stringify(data),
        userId: ctx.user.id
      });
      return { success: true };
    }),
    addMaterial: protectedProcedure.input(z2.object({
      caseId: z2.number(),
      productId: z2.number(),
      requiredQty: z2.number()
    })).mutation(async ({ input, ctx }) => {
      await addSurgeryCaseMaterial(input);
      const materialStatus = await calculateCaseMaterialStatus(input.caseId);
      await updateSurgeryCase(input.caseId, { materialStatus });
      return { success: true };
    }),
    reserveMaterials: protectedProcedure.input(z2.object({ caseId: z2.number() })).mutation(async ({ input, ctx }) => {
      const materials = await getSurgeryCaseMaterials(input.caseId);
      const surgeryCase = await getSurgeryCaseById(input.caseId);
      if (!surgeryCase) {
        throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E04\u0E2A\u0E19\u0E35\u0E49");
      }
      for (const material of materials) {
        if (material.status === "pending") {
          const requiredQty = parseFloat(material.requiredQty);
          const availableLots = await getAvailableLotsFEFO(material.productId, requiredQty);
          let remainingQty = requiredQty;
          for (const lot of availableLots) {
            if (remainingQty <= 0) break;
            const availableQty = parseFloat(lot.availableQty);
            const qtyToReserve = Math.min(availableQty, remainingQty);
            await createReservation({
              lotId: lot.id,
              reservedQty: qtyToReserve,
              reservedBy: ctx.user.id,
              reservedFor: `\u0E40\u0E04\u0E2A ${surgeryCase.caseNumber}`,
              patientName: surgeryCase.patientName,
              surgeryDate: surgeryCase.surgeryDate
            });
            const newAvailableQty = availableQty - qtyToReserve;
            const newReservedQty = parseFloat(lot.reservedQty) + qtyToReserve;
            await updateInventoryLot(lot.id, {
              availableQty: newAvailableQty.toString(),
              reservedQty: newReservedQty.toString()
            });
            remainingQty -= qtyToReserve;
          }
          const reservedQty = requiredQty - remainingQty;
          await updateSurgeryCaseMaterial(material.id, {
            reservedQty: reservedQty.toString(),
            status: reservedQty >= requiredQty ? "reserved" : "pending"
          });
        }
      }
      const materialStatus = await calculateCaseMaterialStatus(input.caseId);
      await updateSurgeryCase(input.caseId, { materialStatus });
      return { success: true, materialStatus };
    })
  }),
  // ==================== Push Subscriptions ====================
  pushSubscriptions: router({
    subscribe: protectedProcedure.input(z2.object({
      endpoint: z2.string(),
      p256dh: z2.string(),
      auth: z2.string()
    })).mutation(async ({ input, ctx }) => {
      await savePushSubscription({
        userId: ctx.user.id,
        ...input
      });
      return { success: true };
    }),
    unsubscribe: protectedProcedure.input(z2.object({ endpoint: z2.string() })).mutation(async ({ input }) => {
      await deletePushSubscription(input.endpoint);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
