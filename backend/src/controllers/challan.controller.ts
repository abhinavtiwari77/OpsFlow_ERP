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

import PDFDocument from "pdfkit";

// GET /challans/:id/pdf
// Generates a PDF from a challan's snapshot data and streams it back.
export async function exportPdf(req: Request, res: Response) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!challan) throw new ApiError(404, "Challan not found");

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="sales-challan-${challan.challanNumber}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text("OpsFlow ERP", { align: "left" });
  doc.fontSize(16).text("SALES CHALLAN", { align: "right" });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Challan No: ${challan.challanNumber}`);
  doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${challan.status}`);
  doc.text(`Created By: ${challan.createdBy?.name || "-"}`);
  doc.moveDown(2);

  // Customer Section
  doc.fontSize(12).text("BILL TO / CUSTOMER", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Name: ${challan.customer.name}`);
  if (challan.customer.businessName) doc.text(`Business Name: ${challan.customer.businessName}`);
  doc.text(`Phone: ${challan.customer.mobile}`);
  if (challan.customer.email) doc.text(`Email: ${challan.customer.email}`);
  if (challan.customer.address) doc.text(`Address: ${challan.customer.address}`);
  if (challan.customer.gstNumber) doc.text(`GST: ${challan.customer.gstNumber}`);
  doc.moveDown(2);

  // Items Table
  doc.fontSize(12).text("ITEMS", { underline: true });
  doc.moveDown(0.5);
  
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 80;
  const col3 = 250;
  const col4 = 350;
  const col5 = 400;
  const col6 = 480;

  doc.fontSize(10);
  doc.font("Helvetica-Bold");
  doc.text("#", col1, tableTop);
  doc.text("Product", col2, tableTop);
  doc.text("SKU", col3, tableTop);
  doc.text("Qty", col4, tableTop);
  doc.text("Unit Price", col5, tableTop);
  doc.text("Total", col6, tableTop);
  doc.font("Helvetica");
  
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
  doc.moveDown(1);

  let y = doc.y;
  let subtotal = 0;

  for (let i = 0; i < challan.items.length; i++) {
    const item = challan.items[i];
    const unitPrice = parseFloat(item.unitPriceSnapshot as any);
    const total = unitPrice * item.quantity;
    subtotal += total;

    doc.text((i + 1).toString(), col1, y);
    doc.text(item.productNameSnapshot, col2, y, { width: 160 });
    doc.text(item.productSkuSnapshot, col3, y, { width: 90 });
    doc.text(item.quantity.toString(), col4, y);
    doc.text(`Rs. ${unitPrice.toFixed(2)}`, col5, y);
    doc.text(`Rs. ${total.toFixed(2)}`, col6, y);

    y += 20;
  }

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
  
  doc.moveDown(2);
  doc.y = y + 20;
  doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { align: "right" });
  doc.text(`Grand Total: Rs. ${subtotal.toFixed(2)}`, { align: "right" });

  doc.moveDown(4);
  doc.text("Prepared By: OpsFlow ERP", 50, doc.y);

  doc.end();
}
