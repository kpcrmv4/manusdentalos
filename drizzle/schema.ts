import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * หมวดหมู่สินค้า (Categories)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * ข้อมูลสินค้า (Product Master)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productCode: varchar("productCode", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  refCode: varchar("refCode", { length: 100 }),
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }),
  size: varchar("size", { length: 100 }),
  categoryId: int("categoryId").references(() => categories.id),
  unit: varchar("unit", { length: 50 }).notNull().default("ชิ้น"),
  minStockLevel: int("minStockLevel").default(0),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
}, (table) => ({
  productCodeIdx: index("productCode_idx").on(table.productCode),
  refCodeIdx: index("refCode_idx").on(table.refCode),
  nameIdx: index("name_idx").on(table.name),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * ข้อมูล Supplier
 */
export const suppliers = mysqlTable("suppliers", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * ล็อตสินค้า (Inventory Lots)
 */
export const inventoryLots = mysqlTable("inventoryLots", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdIdx: index("productId_idx").on(table.productId),
  lotNumberIdx: index("lotNumber_idx").on(table.lotNumber),
  expiryDateIdx: index("expiryDate_idx").on(table.expiryDate),
}));

export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InsertInventoryLot = typeof inventoryLots.$inferInsert;

/**
 * ใบสั่งซื้อ (Purchase Orders)
 */
export const purchaseOrders = mysqlTable("purchaseOrders", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  poNumberIdx: index("poNumber_idx").on(table.poNumber),
  statusIdx: index("status_idx").on(table.status),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * รายการสินค้าในใบสั่งซื้อ (Purchase Order Items)
 */
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("poId").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id),
  orderedQty: decimal("orderedQty", { precision: 10, scale: 2 }).notNull(),
  receivedQty: decimal("receivedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * การจองสินค้า (Reservations)
 */
export const reservations = mysqlTable("reservations", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  lotIdIdx: index("lotId_idx").on(table.lotId),
  statusIdx: index("status_idx").on(table.status),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate),
}));

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * บันทึกการใช้วัสดุ (Usage Logs)
 */
export const usageLogs = mysqlTable("usageLogs", {
  id: int("id").autoincrement().primaryKey(),
  lotId: int("lotId").notNull().references(() => inventoryLots.id),
  reservationId: int("reservationId").references(() => reservations.id),
  usedQty: decimal("usedQty", { precision: 10, scale: 2 }).notNull(),
  patientName: varchar("patientName", { length: 255 }),
  surgeryDate: timestamp("surgeryDate"),
  photoEvidence: text("photoEvidence"),
  notes: text("notes"),
  loggedBy: int("loggedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  lotIdIdx: index("lotId_idx").on(table.lotId),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate),
}));

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

/**
 * บันทึกการเปลี่ยนแปลง (Audit Trail)
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  tableName: varchar("tableName", { length: 100 }).notNull(),
  recordId: int("recordId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  oldValues: text("oldValues"),
  newValues: text("newValues"),
  userId: int("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tableNameIdx: index("tableName_idx").on(table.tableName),
  recordIdIdx: index("recordId_idx").on(table.recordId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * การแจ้งเตือน (Notifications)
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["low_stock", "expiring_soon", "expired", "pending_order", "slow_moving"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message").notNull(),
  relatedTable: varchar("relatedTable", { length: 100 }),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false).notNull(),
  userId: int("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  isReadIdx: index("isRead_idx").on(table.isRead),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * เคสผ่าตัด (Surgery Cases)
 */
export const surgeryCases = mysqlTable("surgeryCases", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("caseNumber_idx").on(table.caseNumber),
  surgeryDateIdx: index("surgeryDate_idx").on(table.surgeryDate),
  statusIdx: index("status_idx").on(table.status),
}));

export type SurgeryCase = typeof surgeryCases.$inferSelect;
export type InsertSurgeryCase = typeof surgeryCases.$inferInsert;

/**
 * วัสดุที่ต้องใช้ในเคสผ่าตัด (Surgery Case Materials)
 */
export const surgeryCaseMaterials = mysqlTable("surgeryCaseMaterials", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull().references(() => surgeryCases.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id),
  requiredQty: decimal("requiredQty", { precision: 10, scale: 2 }).notNull(),
  reservedQty: decimal("reservedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  usedQty: decimal("usedQty", { precision: 10, scale: 2 }).notNull().default("0"),
  status: mysqlEnum("status", ["pending", "reserved", "used"]).default("pending").notNull(),
  reservationId: int("reservationId").references(() => reservations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurgeryCaseMaterial = typeof surgeryCaseMaterials.$inferSelect;
export type InsertSurgeryCaseMaterial = typeof surgeryCaseMaterials.$inferInsert;

/**
 * PWA Push Subscriptions
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  inventoryLots: many(inventoryLots),
}));

export const inventoryLotsRelations = relations(inventoryLots, ({ one, many }) => ({
  product: one(products, {
    fields: [inventoryLots.productId],
    references: [products.id],
  }),
  supplier: one(suppliers, {
    fields: [inventoryLots.supplierId],
    references: [suppliers.id],
  }),
  reservations: many(reservations),
  usageLogs: many(usageLogs),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.poId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  lot: one(inventoryLots, {
    fields: [reservations.lotId],
    references: [inventoryLots.id],
  }),
  reservedByUser: one(users, {
    fields: [reservations.reservedBy],
    references: [users.id],
  }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  lot: one(inventoryLots, {
    fields: [usageLogs.lotId],
    references: [inventoryLots.id],
  }),
  reservation: one(reservations, {
    fields: [usageLogs.reservationId],
    references: [reservations.id],
  }),
  loggedByUser: one(users, {
    fields: [usageLogs.loggedBy],
    references: [users.id],
  }),
}));


export const surgeryCasesRelations = relations(surgeryCases, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [surgeryCases.createdBy],
    references: [users.id],
  }),
  materials: many(surgeryCaseMaterials),
}));

export const surgeryCaseMaterialsRelations = relations(surgeryCaseMaterials, ({ one }) => ({
  surgeryCase: one(surgeryCases, {
    fields: [surgeryCaseMaterials.caseId],
    references: [surgeryCases.id],
  }),
  product: one(products, {
    fields: [surgeryCaseMaterials.productId],
    references: [products.id],
  }),
  reservation: one(reservations, {
    fields: [surgeryCaseMaterials.reservationId],
    references: [reservations.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));
