import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  currentStock: z.number().int().nonnegative().optional(),
  minStockAlert: z.number().int().nonnegative().optional(),
  location: z.string().optional().nullable(),
});

// POST /products
export async function createProduct(req: Request, res: Response) {
  const data = productSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new ApiError(409, `SKU '${data.sku}' already exists`);

  const product = await prisma.product.create({ data });
  res.status(201).json(product);
}

// GET /products?search=&category=&lowStock=true&page=&pageSize=
export async function listProducts(req: Request, res: Response) {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || "20"), 1), 100);
  const search = (req.query.search as string) || undefined;
  const category = (req.query.category as string) || undefined;
  const lowStock = req.query.lowStock === "true";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  let items = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  if (lowStock) {
    items = items.filter((p: (typeof items)[number]) => p.currentStock <= p.minStockAlert);
  }

  const total = await prisma.product.count({ where });

  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

// GET /products/:id
export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
}

// PUT /products/:id
export async function updateProduct(req: Request, res: Response) {
  const data = productSchema.partial().parse(req.body);

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Product not found");

  if (data.sku && data.sku !== existing.sku) {
    const clash = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (clash) throw new ApiError(409, `SKU '${data.sku}' already exists`);
  }

  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  res.json(product);
}

const movementSchema = z.object({
  quantity: z.number().int().positive(),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1),
});

// POST /products/:id/stock-movement
// Manual stock adjustment (e.g. purchase order received, damage, correction).
// Sales-driven OUT movements happen automatically via challan confirmation.
export async function recordStockMovement(req: Request, res: Response) {
  const { quantity, movementType, reason } = movementSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new ApiError(404, "Product not found");

  if (movementType === "OUT" && product.currentStock < quantity) {
    throw new ApiError(400, `Insufficient stock. Available: ${product.currentStock}, requested: ${quantity}`);
  }

  const newStock = movementType === "IN" ? product.currentStock + quantity : product.currentStock - quantity;

  const [, movement] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { currentStock: newStock } }),
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity,
        movementType,
        reason,
        createdById: req.user!.userId,
      },
    }),
  ]);

  res.status(201).json({ movement, newStock });
}

// DELETE /products/:id
export async function deleteProduct(req: Request, res: Response) {
  const existing = await prisma.product.findUnique({ 
    where: { id: req.params.id },
    include: { challanItems: { take: 1 }, stockMovements: { take: 1 } }
  });
  if (!existing) throw new ApiError(404, "Product not found");

  if (existing.challanItems.length > 0 || existing.stockMovements.length > 0) {
    throw new ApiError(409, "Cannot delete product because it is referenced by existing stock movements or sales challans.");
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
