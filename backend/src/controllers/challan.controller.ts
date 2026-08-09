import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { generateChallanNumber } from "../utils/challanNumber";

// Type note: `tx` and `ProductRecord` are intentionally loose here. Once you
// run `npx prisma generate` with normal internet access (see README), the
// Prisma Client's generated types give you full autocomplete/type-checking
// on tx.product, tx.salesChallan, etc. - this file doesn't need to change.
type Tx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
type ProductRecord = {
  id: string;
  name: string;
  sku: string;
  unitPrice: any;
  currentStock: number;
};

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createChallanSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional().default("DRAFT"),
});

// POST /challans
// Creates a challan with product snapshots. If status is CONFIRMED, stock is
// reduced immediately and validated so it never goes negative.
export async function createChallan(req: Request, res: Response) {
  const data = createChallanSchema.parse(req.body);

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw new ApiError(404, "Customer not found");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "One or more products were not found");
  }

  const productMap = new Map<string, ProductRecord>(products.map((p: ProductRecord) => [p.id, p]));
  const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

  if (data.status === "CONFIRMED") {
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      if (product.currentStock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for '${product.name}' (SKU ${product.sku}). Available: ${product.currentStock}, requested: ${item.quantity}`
        );
      }
    }
  }

  const challanNumber = await generateChallanNumber();

  const challan = await prisma.$transaction(async (tx: Tx) => {
    const created = await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: data.status,
        createdById: req.user!.userId,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    if (data.status === "CONFIRMED") {
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales challan ${challanNumber}`,
            createdById: req.user!.userId,
          },
        });
      }
    }

    return created;
  });

  res.status(201).json(challan);
}

// GET /challans?status=&customerId=&page=&pageSize=
export async function listChallans(req: Request, res: Response) {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || "20"), 1), 100);
  const status = (req.query.status as string) || undefined;
  const customerId = (req.query.customerId as string) || undefined;

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [items, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { name: true, businessName: true } }, items: true },
    }),
    prisma.salesChallan.count({ where }),
  ]);

  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

// GET /challans/:id
export async function getChallan(req: Request, res: Response) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: { include: { product: true } }, createdBy: { select: { name: true } } },
  });
  if (!challan) throw new ApiError(404, "Challan not found");
  res.json(challan);
}

// POST /challans/:id/confirm
// Moves a DRAFT challan to CONFIRMED and reduces stock at that point.
export async function confirmChallan(req: Request, res: Response) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!challan) throw new ApiError(404, "Challan not found");
  if (challan.status !== "DRAFT") {
    throw new ApiError(400, `Only DRAFT challans can be confirmed. Current status: ${challan.status}`);
  }

  const productIds = challan.items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map<string, ProductRecord>(products.map((p: ProductRecord) => [p.id, p]));

  for (const item of challan.items) {
    const product = productMap.get(item.productId)!;
    if (product.currentStock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for '${product.name}'. Available: ${product.currentStock}, requested: ${item.quantity}`
      );
    }
  }

  const updated = await prisma.$transaction(async (tx: Tx) => {
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales challan ${challan.challanNumber}`,
          createdById: req.user!.userId,
        },
      });
    }
    return tx.salesChallan.update({
      where: { id: challan.id },
      data: { status: "CONFIRMED" },
      include: { items: true },
    });
  });

  res.json(updated);
}

// POST /challans/:id/cancel
// Cancels a challan. If it was already CONFIRMED, stock is restored.
export async function cancelChallan(req: Request, res: Response) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!challan) throw new ApiError(404, "Challan not found");
  if (challan.status === "CANCELLED") throw new ApiError(400, "Challan is already cancelled");

  const wasConfirmed = challan.status === "CONFIRMED";

  const updated = await prisma.$transaction(async (tx: Tx) => {
    if (wasConfirmed) {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "IN",
            reason: `Cancelled sales challan ${challan.challanNumber}`,
            createdById: req.user!.userId,
          },
        });
      }
    }
    return tx.salesChallan.update({
      where: { id: challan.id },
      data: { status: "CANCELLED" },
    });
  });

  res.json(updated);
}
