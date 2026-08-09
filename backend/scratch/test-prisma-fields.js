const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("prisma.product.fields:", prisma.product.fields);
  try {
    const count = await prisma.product.count({
      where: { currentStock: { lte: prisma.product.fields ? prisma.product.fields.minStockAlert : undefined } }
    });
    console.log("Count:", count);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
