import { eq, and, or, like, desc, asc, sql, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  categories,
  products,
  suppliers,
  inventoryLots,
  purchaseOrders,
  purchaseOrderItems,
  reservations,
  usageLogs,
  auditLogs,
  notifications,
  surgeryCases,
  surgeryCaseMaterials,
  pushSubscriptions,
  type Category,
  type Product,
  type Supplier,
  type InventoryLot,
  type PurchaseOrder,
  type Reservation,
  type SurgeryCase,
  type SurgeryCaseMaterial,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Categories ====================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: { name: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}

// ==================== Products ====================

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  return await db
    .select()
    .from(products)
    .where(
      or(
        like(products.productCode, searchPattern),
        like(products.name, searchPattern),
        like(products.refCode, searchPattern),
        like(products.brand, searchPattern),
        like(products.model, searchPattern)
      )
    )
    .limit(20);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductByCode(productCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.productCode, productCode)).limit(1);
  return result[0];
}

export async function getAllProducts(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (categoryId) {
    return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(asc(products.name));
  }
  
  return await db.select().from(products).orderBy(asc(products.name));
}

export async function createProduct(data: {
  productCode: string;
  name: string;
  refCode?: string;
  brand?: string;
  model?: string;
  size?: string;
  categoryId?: number;
  unit?: string;
  minStockLevel?: number;
  description?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<Product>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set(data).where(eq(products.id, id));
}

// ==================== Suppliers ====================

export async function getAllSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  leadTimeDays?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(suppliers).values(data);
  return result;
}

// ==================== Inventory Lots ====================

export async function getAllInventoryLots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryLots).orderBy(asc(inventoryLots.expiryDate));
}

export async function getInventoryLotsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(inventoryLots)
    .where(eq(inventoryLots.productId, productId))
    .orderBy(asc(inventoryLots.expiryDate));
}

export async function getAvailableLotsFEFO(productId: number, requiredQty: number) {
  const db = await getDb();
  if (!db) return [];
  
  // FEFO: First-Expired, First-Out
  return await db
    .select()
    .from(inventoryLots)
    .where(
      and(
        eq(inventoryLots.productId, productId),
        sql`${inventoryLots.availableQty} > 0`
      )
    )
    .orderBy(asc(inventoryLots.expiryDate));
}

export async function createInventoryLot(data: {
  productId: number;
  lotNumber: string;
  expiryDate?: Date;
  physicalQty: number;
  availableQty: number;
  costPrice?: number;
  supplierId?: number;
  invoiceNo?: string;
  refCode?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = {
    ...data,
    physicalQty: data.physicalQty.toString(),
    availableQty: data.availableQty.toString(),
    reservedQty: "0",
    costPrice: data.costPrice?.toString(),
  };
  
  const result = await db.insert(inventoryLots).values(values);
  return result;
}

export async function updateInventoryLot(id: number, data: Partial<InventoryLot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inventoryLots).set(data).where(eq(inventoryLots.id, id));
}

// ==================== Reservations ====================

export async function createReservation(data: {
  lotId: number;
  reservedQty: number;
  reservedBy: number;
  reservedFor?: string;
  patientName?: string;
  surgeryDate?: Date;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = {
    ...data,
    reservedQty: data.reservedQty.toString(),
  };
  
  const result = await db.insert(reservations).values(values);
  return result;
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result[0];
}

export async function updateReservation(id: number, data: Partial<Reservation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(reservations).set(data).where(eq(reservations.id, id));
}

export async function getActiveReservationsByLot(lotId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.lotId, lotId),
        eq(reservations.status, 'active')
      )
    );
}

// ==================== Purchase Orders ====================

export async function getAllPurchaseOrders(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, status as any))
      .orderBy(desc(purchaseOrders.orderDate));
  }
  
  return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.orderDate));
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}

export async function createPurchaseOrder(data: {
  poNumber: string;
  supplierId: number;
  expectedDeliveryDate?: Date;
  totalAmount?: number;
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = {
    ...data,
    totalAmount: data.totalAmount?.toString(),
  };
  
  const result = await db.insert(purchaseOrders).values(values);
  return result;
}

export async function updatePurchaseOrder(id: number, data: Partial<PurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
}

export async function getPurchaseOrderItems(poId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.poId, poId));
}

export async function createPurchaseOrderItem(data: {
  poId: number;
  productId: number;
  orderedQty: number;
  unitPrice?: number;
  totalPrice?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = {
    ...data,
    orderedQty: data.orderedQty.toString(),
    receivedQty: "0",
    unitPrice: data.unitPrice?.toString(),
    totalPrice: data.totalPrice?.toString(),
  };
  
  const result = await db.insert(purchaseOrderItems).values(values);
  return result;
}

// ==================== Audit Logs ====================

export async function createAuditLog(data: {
  tableName: string;
  recordId: number;
  action: 'create' | 'update' | 'delete';
  oldValues?: string;
  newValues?: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(auditLogs).values(data);
  return result;
}

// ==================== Notifications ====================

export async function createNotification(data: {
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'pending_order' | 'slow_moving';
  title: string;
  message: string;
  relatedTable?: string;
  relatedId?: number;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (unreadOnly) {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }
  
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

// ==================== Low Stock Detection ====================

export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  
  // Get products where total available quantity is below minStockLevel
  const result = await db
    .select({
      product: products,
      totalAvailable: sql<number>`SUM(${inventoryLots.availableQty})`,
    })
    .from(products)
    .leftJoin(inventoryLots, eq(products.id, inventoryLots.productId))
    .groupBy(products.id)
    .having(sql`SUM(${inventoryLots.availableQty}) < ${products.minStockLevel}`);
  
  return result;
}

// ==================== Expiring Soon Detection ====================

export async function getExpiringSoonLots(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db
    .select()
    .from(inventoryLots)
    .where(
      and(
        sql`${inventoryLots.expiryDate} IS NOT NULL`,
        lte(inventoryLots.expiryDate, futureDate),
        gte(inventoryLots.expiryDate, new Date()),
        sql`${inventoryLots.availableQty} > 0`
      )
    )
    .orderBy(asc(inventoryLots.expiryDate));
}


// ==================== Surgery Cases ====================

export async function getAllSurgeryCases(filters?: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
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
    conditions.push(eq(surgeryCases.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    return await db.select().from(surgeryCases).where(and(...conditions)).orderBy(asc(surgeryCases.surgeryDate));
  }
  
  return await db.select().from(surgeryCases).orderBy(asc(surgeryCases.surgeryDate));
}

export async function getSurgeryCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surgeryCases).where(eq(surgeryCases.id, id)).limit(1);
  return result[0];
}

export async function getSurgeryCaseByNumber(caseNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surgeryCases).where(eq(surgeryCases.caseNumber, caseNumber)).limit(1);
  return result[0];
}

export async function createSurgeryCase(data: {
  caseNumber: string;
  patientName: string;
  patientId?: string;
  surgeryDate: Date;
  surgeryType?: string;
  dentistName?: string;
  notes?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(surgeryCases).values(data);
  return result;
}

export async function updateSurgeryCase(id: number, data: Partial<SurgeryCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(surgeryCases).set(data).where(eq(surgeryCases.id, id));
}

export async function getSurgeryCaseMaterials(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(surgeryCaseMaterials).where(eq(surgeryCaseMaterials.caseId, caseId));
}

export async function addSurgeryCaseMaterial(data: {
  caseId: number;
  productId: number;
  requiredQty: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = {
    ...data,
    requiredQty: data.requiredQty.toString(),
    reservedQty: "0",
    usedQty: "0",
  };
  
  const result = await db.insert(surgeryCaseMaterials).values(values);
  return result;
}

export async function updateSurgeryCaseMaterial(id: number, data: Partial<SurgeryCaseMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(surgeryCaseMaterials).set(data).where(eq(surgeryCaseMaterials.id, id));
}

export async function calculateCaseMaterialStatus(caseId: number): Promise<'green' | 'yellow' | 'red'> {
  const db = await getDb();
  if (!db) return 'red';
  
  const materials = await getSurgeryCaseMaterials(caseId);
  
  if (materials.length === 0) return 'red';
  
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
  
  if (allReserved) return 'green';
  if (someReserved) return 'yellow';
  return 'red';
}

// ==================== Push Subscriptions ====================

export async function savePushSubscription(data: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if subscription already exists
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, data.endpoint))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(pushSubscriptions)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0];
  }
  
  const result = await db.insert(pushSubscriptions).values(data);
  return result;
}

export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      )
    );
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pushSubscriptions)
    .set({ isActive: false })
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getAllActivePushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, true));
}
