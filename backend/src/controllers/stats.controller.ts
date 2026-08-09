import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getDashboardStats(req: Request, res: Response) {
  // Execute all queries in parallel, but from a single endpoint
  // This drastically reduces HTTP overhead and connection pool contention
  const [
    customersCount,
    productsCount,
    lowStockCount,
    challansCount,
    recentChallans,
    lowStockProducts
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.product.count({ where: { currentStock: { lte: prisma.product.fields.minStockAlert } } }),
    prisma.salesChallan.count(),
    prisma.salesChallan.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, businessName: true } } }
    }),
    prisma.product.findMany({
      where: { currentStock: { lte: prisma.product.fields.minStockAlert } },
      take: 5,
      orderBy: { currentStock: "asc" }
    })
  ]);

  res.json({
    stats: {
      customers: customersCount,
      products: productsCount,
      lowStock: lowStockCount,
      challans: challansCount
    },
    recentChallans,
    lowStockProducts
  });
}
