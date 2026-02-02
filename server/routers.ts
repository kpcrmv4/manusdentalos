import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== Categories ====================
  categories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createCategory(input);
        await db.createAuditLog({
          tableName: 'categories',
          recordId: 0,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ==================== Products ====================
  products: router({
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.query);
      }),
    list: protectedProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllProducts(input?.categoryId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        productCode: z.string().min(1),
        name: z.string().min(1),
        refCode: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        size: z.string().optional(),
        categoryId: z.number().optional(),
        unit: z.string().default('ชิ้น'),
        minStockLevel: z.number().default(0),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ตรวจสอบว่ามี productCode ซ้ำหรือไม่
        const existing = await db.getProductByCode(input.productCode);
        if (existing) {
          throw new Error('รหัสสินค้านี้มีอยู่ในระบบแล้ว');
        }

        await db.createProduct({
          ...input,
          createdBy: ctx.user.id,
        });

        await db.createAuditLog({
          tableName: 'products',
          recordId: 0,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        productCode: z.string().optional(),
        name: z.string().optional(),
        refCode: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        size: z.string().optional(),
        categoryId: z.number().optional(),
        unit: z.string().optional(),
        minStockLevel: z.number().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;
        const oldProduct = await db.getProductById(id);

        await db.updateProduct(id, updateData);

        await db.createAuditLog({
          tableName: 'products',
          recordId: id,
          action: 'update',
          oldValues: JSON.stringify(oldProduct),
          newValues: JSON.stringify(updateData),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // ==================== Suppliers ====================
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSuppliers();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSupplierById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        leadTimeDays: z.number().default(7),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createSupplier(input);

        await db.createAuditLog({
          tableName: 'suppliers',
          recordId: 0,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // ==================== Inventory Lots ====================
  inventory: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllInventoryLots();
    }),
    getLotsByProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInventoryLotsByProduct(input.productId);
      }),
    getAvailableLotsFEFO: protectedProcedure
      .input(z.object({
        productId: z.number(),
        requiredQty: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getAvailableLotsFEFO(input.productId, input.requiredQty);
      }),
    createLot: protectedProcedure
      .input(z.object({
        productId: z.number(),
        lotNumber: z.string().min(1),
        expiryDate: z.date().optional(),
        physicalQty: z.number(),
        costPrice: z.number().optional(),
        supplierId: z.number().optional(),
        invoiceNo: z.string().optional(),
        refCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createInventoryLot({
          ...input,
          availableQty: input.physicalQty,
        });

        await db.createAuditLog({
          tableName: 'inventoryLots',
          recordId: 0,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
    getLowStock: protectedProcedure.query(async () => {
      return await db.getLowStockProducts();
    }),
    getExpiringSoon: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(30) }))
      .query(async ({ input }) => {
        return await db.getExpiringSoonLots(input.daysAhead);
      }),
  }),

  // ==================== Reservations ====================
  reservations: router({
    create: protectedProcedure
      .input(z.object({
        lotId: z.number(),
        reservedQty: z.number(),
        reservedFor: z.string().optional(),
        patientName: z.string().optional(),
        surgeryDate: z.date().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ตรวจสอบว่า lot มี available qty เพียงพอหรือไม่
        const lot = await db.getInventoryLotsByProduct(0).then(lots => 
          lots.find(l => l.id === input.lotId)
        );

        if (!lot) {
          throw new Error('ไม่พบข้อมูล Lot นี้');
        }

        const availableQty = parseFloat(lot.availableQty);
        if (availableQty < input.reservedQty) {
          throw new Error(`จำนวนคงเหลือไม่เพียงพอ (เหลือ ${availableQty} ${lot.productId})`);
        }

        // สร้าง reservation
        await db.createReservation({
          ...input,
          reservedBy: ctx.user.id,
        });

        // อัปเดต available qty และ reserved qty
        const newAvailableQty = availableQty - input.reservedQty;
        const newReservedQty = parseFloat(lot.reservedQty) + input.reservedQty;

        await db.updateInventoryLot(input.lotId, {
          availableQty: newAvailableQty.toString(),
          reservedQty: newReservedQty.toString(),
        });

        await db.createAuditLog({
          tableName: 'reservations',
          recordId: 0,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
    commit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await db.getReservationById(input.id);
        if (!reservation) {
          throw new Error('ไม่พบข้อมูล Reservation นี้');
        }

        if (reservation.status !== 'active') {
          throw new Error('Reservation นี้ไม่สามารถ commit ได้');
        }

        // อัปเดตสถานะเป็น committed
        await db.updateReservation(input.id, {
          status: 'committed',
          committedAt: new Date(),
        });

        // ลด reserved qty และ physical qty
        const lot = await db.getInventoryLotsByProduct(0).then(lots =>
          lots.find(l => l.id === reservation.lotId)
        );

        if (lot) {
          const newReservedQty = parseFloat(lot.reservedQty) - parseFloat(reservation.reservedQty);
          const newPhysicalQty = parseFloat(lot.physicalQty) - parseFloat(reservation.reservedQty);

          await db.updateInventoryLot(reservation.lotId, {
            reservedQty: newReservedQty.toString(),
            physicalQty: newPhysicalQty.toString(),
          });
        }

        await db.createAuditLog({
          tableName: 'reservations',
          recordId: input.id,
          action: 'update',
          oldValues: JSON.stringify(reservation),
          newValues: JSON.stringify({ status: 'committed' }),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await db.getReservationById(input.id);
        if (!reservation) {
          throw new Error('ไม่พบข้อมูล Reservation นี้');
        }

        if (reservation.status !== 'active') {
          throw new Error('Reservation นี้ไม่สามารถยกเลิกได้');
        }

        // อัปเดตสถานะเป็น cancelled
        await db.updateReservation(input.id, {
          status: 'cancelled',
          cancelledAt: new Date(),
        });

        // คืน available qty และลด reserved qty
        const lot = await db.getInventoryLotsByProduct(0).then(lots =>
          lots.find(l => l.id === reservation.lotId)
        );

        if (lot) {
          const newAvailableQty = parseFloat(lot.availableQty) + parseFloat(reservation.reservedQty);
          const newReservedQty = parseFloat(lot.reservedQty) - parseFloat(reservation.reservedQty);

          await db.updateInventoryLot(reservation.lotId, {
            availableQty: newAvailableQty.toString(),
            reservedQty: newReservedQty.toString(),
          });
        }

        await db.createAuditLog({
          tableName: 'reservations',
          recordId: input.id,
          action: 'update',
          oldValues: JSON.stringify(reservation),
          newValues: JSON.stringify({ status: 'cancelled' }),
          userId: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // ==================== Purchase Orders ====================
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllPurchaseOrders(input?.status);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const po = await db.getPurchaseOrderById(input.id);
        if (!po) return null;

        const items = await db.getPurchaseOrderItems(input.id);
        return { ...po, items };
      }),
    create: protectedProcedure
      .input(z.object({
        poNumber: z.string().min(1),
        supplierId: z.number(),
        expectedDeliveryDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          orderedQty: z.number(),
          unitPrice: z.number().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { items, ...poData } = input;

        // คำนวณยอดรวม
        const totalAmount = items.reduce((sum, item) => {
          return sum + (item.unitPrice || 0) * item.orderedQty;
        }, 0);

        // สร้าง PO
        await db.createPurchaseOrder({
          ...poData,
          totalAmount,
          createdBy: ctx.user.id,
        });

        // หา PO ที่เพิ่งสร้าง
        const createdPO = await db.getAllPurchaseOrders();
        const poId = createdPO[0]?.id || 0;

        // สร้าง PO Items
        for (const item of items) {
          await db.createPurchaseOrderItem({
            poId,
            productId: item.productId,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice,
            totalPrice: (item.unitPrice || 0) * item.orderedQty,
          });
        }

        await db.createAuditLog({
          tableName: 'purchaseOrders',
          recordId: poId,
          action: 'create',
          newValues: JSON.stringify(input),
          userId: ctx.user.id,
        });

        return { success: true, poId };
      }),
  }),

  // ==================== Notifications ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserNotifications(ctx.user.id, input.unreadOnly);
      }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
