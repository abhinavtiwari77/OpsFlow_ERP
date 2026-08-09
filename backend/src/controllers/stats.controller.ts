import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hasPermission } from "../../../shared/permissions";
import { Role } from "../../../shared/permissions";

type ProductRow = { id: string; name: string; sku: string; currentStock: number; minStockAlert: number };

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const role = req.user!.role as Role;

    // Determine access for each metric based on RBAC — no unauthorized DB queries
    const canViewCustomers = hasPermission(role, "customers", "list");
    const canViewProducts  = hasPermission(role, "products",  "list");
    const canViewChallans  = hasPermission(role, "salesChallans", "list");

    // Run all authorized queries in parallel
    const [
      customersCount,
      productsCount,
      challansCount,
      recentChallansList,
      // Use $queryRaw for accurate low-stock column comparison (currentStock <= minStockAlert)
      // Prisma does not support comparing two columns with standard findMany filters
      lowStockAll,
    ] = await Promise.all([
      canViewCustomers ? prisma.customer.count()                              : Promise.resolve<null>(null),
      canViewProducts  ? prisma.product.count()                              : Promise.resolve<null>(null),
      canViewChallans  ? prisma.salesChallan.count()                         : Promise.resolve<null>(null),
      canViewChallans  ? prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true, businessName: true } } },
      })                                                                      : Promise.resolve<null>(null),
      canViewProducts
        ? prisma.$queryRaw<ProductRow[]>`
            SELECT id, name, sku, "currentStock", "minStockAlert"
            FROM "Product"
            WHERE "currentStock" <= "minStockAlert"
            ORDER BY "currentStock" ASC`
        : Promise.resolve<null>(null),
    ]);

    const lowStockProducts = canViewProducts && lowStockAll ? lowStockAll.slice(0, 5) : null;
    const lowStockCount    = canViewProducts && lowStockAll ? lowStockAll.length       : null;

    res.json({
      stats: {
        customers: customersCount,
        products:  productsCount,
        lowStock:  lowStockCount,
        challans:  challansCount,
      },
      recentChallans:   recentChallansList,
      lowStockProducts: lowStockProducts,
    });
  } catch (error) {
    // Log the FULL error so we can see the real cause in Render logs
    console.error("GET /stats failed:", error);
    res.status(500).json({ error: "Failed to load dashboard statistics" });
  }
}

