import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hasPermission, Role } from "../../../shared/permissions";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const role = req.user!.role as Role;

    // Check permissions — unauthorized metrics are skipped entirely (no DB query)
    const canViewCustomers = hasPermission(role, "customers",    "list");
    const canViewProducts  = hasPermission(role, "products",     "list");
    const canViewChallans  = hasPermission(role, "salesChallans","list");

    // Fire all authorized queries in a single parallel batch.
    // NOTE: $queryRaw is avoided because Supabase's pgbouncer transaction-mode
    //       pooler does not support prepared statements used by $queryRaw.
    // NOTE: Comparing two columns (currentStock <= minStockAlert) is not
    //       supported by Prisma findMany without raw SQL.  Instead we fetch
    //       id/currentStock/minStockAlert for all products (lightweight) and
    //       filter in-memory — correct and pgbouncer-safe.
    const [
      customersCount,
      allProducts,          // used for both product count + low-stock
      challansCount,
      recentChallansList,
    ] = await Promise.all([
      canViewCustomers
        ? prisma.customer.count()
        : Promise.resolve<null>(null),

      canViewProducts
        ? prisma.product.findMany({
            select: {
              id: true, name: true, sku: true,
              currentStock: true, minStockAlert: true, location: true,
            },
            orderBy: { currentStock: "asc" },
          })
        : Promise.resolve<null>(null),

      canViewChallans
        ? prisma.salesChallan.count()
        : Promise.resolve<null>(null),

      canViewChallans
        ? prisma.salesChallan.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { customer: { select: { name: true, businessName: true } } },
          })
        : Promise.resolve<null>(null),
    ]);

    // Derive low-stock metrics in-memory (avoids extra DB round-trip)
    const lowStockAll      = allProducts ? allProducts.filter(p => p.currentStock <= p.minStockAlert) : null;
    const productsCount    = allProducts ? allProducts.length : null;
    const lowStockCount    = lowStockAll ? lowStockAll.length : null;
    const lowStockProducts = lowStockAll ? lowStockAll.slice(0, 5) : null;

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
    console.error("GET /stats failed:", error);
    res.status(500).json({ error: "Failed to load dashboard statistics" });
  }
}


