import { prisma } from "../lib/prisma";

// Generates a sequential, human readable challan number like CH-2026-000123.
// Uses a simple count-based approach; for high concurrency you'd switch this
// to a DB sequence, but it's sufficient for this project's scale.
export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.salesChallan.count();
  const next = (count + 1).toString().padStart(6, "0");
  return `CH-${year}-${next}`;
}
