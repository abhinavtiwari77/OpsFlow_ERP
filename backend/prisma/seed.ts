import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seeds test logins and modern high-end B2B sample data
async function main() {
  // Clear existing data to remove old businesses
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("opsflow2026", 10);

  const roles = [
    { name: "Admin", email: "admin@opsflow.com", role: "ADMIN" as const },
    { name: "Sales", email: "sales@opsflow.com", role: "SALES" as const },
    { name: "Warehouse", email: "warehouse@opsflow.com", role: "WAREHOUSE" as const },
    { name: "Accounts", email: "accounts@opsflow.com", role: "ACCOUNTS" as const },
  ];

  const users: Record<string, string> = {};
  for (const r of roles) {
    const user = await prisma.user.create({
      data: { name: r.name, email: r.email, passwordHash: password, role: r.role },
    });
    users[r.role] = user.id;
  }

  const products = [
    { name: "MacBook Pro 16-inch (M3 Max)", sku: "APP-MBP-16", category: "Electronics", unitPrice: 3499, currentStock: 45, minStockAlert: 10, location: "Silicon Valley Hub" },
    { name: "Herman Miller Aeron Chair", sku: "FURN-AER-01", category: "Furniture", unitPrice: 1250, currentStock: 120, minStockAlert: 25, location: "New York Warehouse" },
    { name: "Dell UltraSharp 32 4K Monitor", sku: "DELL-U3223QE", category: "Electronics", unitPrice: 850, currentStock: 85, minStockAlert: 15, location: "Silicon Valley Hub" },
    { name: "Logitech MX Master 3S Mouse", sku: "LOGI-MXM3S", category: "Accessories", unitPrice: 99, currentStock: 300, minStockAlert: 50, location: "Austin Distribution" },
    { name: "Keychron K8 Pro Keyboard", sku: "KEYC-K8P", category: "Accessories", unitPrice: 115, currentStock: 210, minStockAlert: 30, location: "Austin Distribution" },
    { name: "Ergotron LX Desk Monitor Arm", sku: "ERGO-LX-01", category: "Furniture", unitPrice: 189, currentStock: 6, minStockAlert: 20, location: "New York Warehouse" }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  const customers = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Eleanor Vance", mobile: "+1-555-0198", email: "eleanor@technova.io",
      businessName: "TechNova Solutions Inc.", customerType: "ENTERPRISE", status: "ACTIVE",
      address: "100 Innovation Drive, San Francisco, CA", createdById: users["SALES"],
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Marcus Sterling", mobile: "+1-555-0245", email: "m.sterling@nexusdynamics.com",
      businessName: "Nexus Dynamics LLC", customerType: "WHOLESALE", status: "ACTIVE",
      address: "450 Corporate Blvd, Seattle, WA", createdById: users["SALES"],
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Chloe Chen", mobile: "+1-555-0377", email: "chloe@apexdesign.studio",
      businessName: "Apex Design Studio", customerType: "RETAIL", status: "ACTIVE",
      address: "78 Creative Way, Austin, TX", createdById: users["SALES"],
    }
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }

  // Create sample challans
  const p1 = await prisma.product.findUnique({ where: { sku: "APP-MBP-16" } });
  const p2 = await prisma.product.findUnique({ where: { sku: "DELL-U3223QE" } });
  const p3 = await prisma.product.findUnique({ where: { sku: "FURN-AER-01" } });
  
  if (p1 && p2 && p3) {
    await prisma.salesChallan.create({
      data: {
        challanNumber: "INV-2026-001",
        customerId: customers[0].id,
        totalQuantity: 20,
        status: "CONFIRMED",
        createdById: users["SALES"],
        items: {
          create: [
            { productId: p1.id, quantity: 10, productNameSnapshot: p1.name, productSkuSnapshot: p1.sku, unitPriceSnapshot: p1.unitPrice },
            { productId: p2.id, quantity: 10, productNameSnapshot: p2.name, productSkuSnapshot: p2.sku, unitPriceSnapshot: p2.unitPrice }
          ]
        }
      }
    });
    
    await prisma.salesChallan.create({
      data: {
        challanNumber: "INV-2026-002",
        customerId: customers[1].id,
        totalQuantity: 50,
        status: "DRAFT",
        createdById: users["SALES"],
        items: {
          create: [
            { productId: p3.id, quantity: 50, productNameSnapshot: p3.name, productSkuSnapshot: p3.sku, unitPriceSnapshot: p3.unitPrice }
          ]
        }
      }
    });
  }

  console.log("Seed complete. Test logins (password: opsflow2026):");
  roles.forEach((r) => console.log(`  ${r.role.padEnd(10)} -> ${r.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
