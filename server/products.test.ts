import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with all required functions
vi.mock("./db", () => ({
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "รากฟันเทียม", description: "Dental Implants", createdAt: new Date() },
    { id: 2, name: "วัสดุปิดแผล", description: "Wound Dressing", createdAt: new Date() },
  ]),
  getAllProducts: vi.fn().mockResolvedValue([
    { id: 1, productCode: "IMP-001", name: "Straumann BLX", categoryId: 1, unit: "ชิ้น", minStockLevel: 10, createdAt: new Date() },
    { id: 2, productCode: "BIO-001", name: "Bio-Oss Granules", categoryId: 2, unit: "กล่อง", minStockLevel: 5, createdAt: new Date() },
  ]),
  getProductsByCategory: vi.fn().mockResolvedValue([
    { id: 1, productCode: "IMP-001", name: "Straumann BLX", categoryId: 1, unit: "ชิ้น", minStockLevel: 10, createdAt: new Date() },
  ]),
  searchProducts: vi.fn().mockResolvedValue([
    { id: 1, productCode: "IMP-001", name: "Straumann BLX", categoryId: 1, unit: "ชิ้น", minStockLevel: 10, createdAt: new Date() },
  ]),
  getProductByCode: vi.fn().mockResolvedValue(null), // No duplicate
  createProduct: vi.fn().mockResolvedValue({ insertId: 3 }),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue({ insertId: 3 }),
  getAllSuppliers: vi.fn().mockResolvedValue([]),
  getSupplierById: vi.fn().mockResolvedValue(null),
  createSupplier: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllInventoryLots: vi.fn().mockResolvedValue([]),
  getInventoryLotsByProduct: vi.fn().mockResolvedValue([]),
  getAvailableLotsFEFO: vi.fn().mockResolvedValue([]),
  createInventoryLot: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllPurchaseOrders: vi.fn().mockResolvedValue([]),
  getPurchaseOrdersByStatus: vi.fn().mockResolvedValue([]),
  createPurchaseOrder: vi.fn().mockResolvedValue({ insertId: 1 }),
  createPurchaseOrderItem: vi.fn().mockResolvedValue({ insertId: 1 }),
  createReservation: vi.fn().mockResolvedValue({ insertId: 1 }),
  getReservationsByLot: vi.fn().mockResolvedValue([]),
  updateReservationStatus: vi.fn().mockResolvedValue(undefined),
  updateInventoryLotQty: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Categories API", () => {
  it("should list all categories", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const categories = await caller.categories.list();
    
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe("รากฟันเทียม");
  });

  it("should create a new category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.categories.create({
      name: "วัสดุทดสอบ",
      description: "Test category",
    });
    
    expect(result.success).toBe(true);
  });
});

describe("Products API", () => {
  it("should list all products", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const products = await caller.products.list();
    
    expect(products).toHaveLength(2);
    expect(products[0].productCode).toBe("IMP-001");
  });

  it("should search products", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const products = await caller.products.search({ query: "Straumann" });
    
    expect(products).toHaveLength(1);
    expect(products[0].name).toContain("Straumann");
  });

  it("should create a new product when code is unique", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.products.create({
      productCode: "TEST-001",
      name: "Test Product",
      categoryId: 1,
      unit: "ชิ้น",
      minStockLevel: 10,
    });
    
    expect(result.success).toBe(true);
  });
});

describe("Suppliers API", () => {
  it("should list all suppliers", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const suppliers = await caller.suppliers.list();
    
    expect(suppliers).toBeInstanceOf(Array);
  });
});

describe("Inventory API", () => {
  it("should list all inventory lots", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const lots = await caller.inventory.list();
    
    expect(lots).toBeInstanceOf(Array);
  });
});
