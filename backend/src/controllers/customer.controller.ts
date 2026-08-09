import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(6),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
  address: z.string().optional().nullable(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// POST /customers
export async function createCustomer(req: Request, res: Response) {
  const data = customerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data: {
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      createdById: req.user!.userId,
    },
  });

  res.status(201).json(customer);
}

// GET /customers?search=&status=&customerType=&page=&pageSize=
export async function listCustomers(req: Request, res: Response) {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const pageSize = Math.min(Math.max(parseInt((req.query.pageSize as string) || "20"), 1), 100);
  const search = (req.query.search as string) || undefined;
  const status = (req.query.status as string) || undefined;
  const customerType = (req.query.customerType as string) || undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (customerType) where.customerType = customerType;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// GET /customers/:id
export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      followUpNotes: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json(customer);
}

// PUT /customers/:id
export async function updateCustomer(req: Request, res: Response) {
  const data = customerSchema.partial().parse(req.body);

  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Customer not found");

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
  });

  res.json(customer);
}

const noteSchema = z.object({ note: z.string().min(1) });

// POST /customers/:id/notes
export async function addFollowUpNote(req: Request, res: Response) {
  const { note } = noteSchema.parse(req.body);

  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) throw new ApiError(404, "Customer not found");

  const created = await prisma.followUpNote.create({
    data: { customerId: req.params.id, note, createdById: req.user!.userId },
  });

  res.status(201).json(created);
}

// DELETE /customers/:id
export async function deleteCustomer(req: Request, res: Response) {
  const existing = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { challans: { take: 1 } }
  });
  if (!existing) throw new ApiError(404, "Customer not found");

  if (existing.challans.length > 0) {
    throw new ApiError(409, "Cannot delete customer because they are referenced by existing sales challans.");
  }

  await prisma.customer.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
