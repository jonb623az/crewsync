import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { companyId: session.user.companyId },
    include: {
      client: true,
      job: {
        include: {
          property: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, jobId, subtotal, taxAmount, discount, total, dueDate, notes } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: session.user.companyId },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { companyId: session.user.companyId },
  });
  const number = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

  const computedSubtotal = subtotal || 0;
  const computedTax = taxAmount || 0;
  const computedDiscount = discount || 0;
  const computedTotal = total !== undefined ? total : computedSubtotal + computedTax - computedDiscount;

  const invoice = await prisma.invoice.create({
    data: {
      companyId: session.user.companyId,
      clientId,
      jobId: jobId || null,
      number,
      status: "DRAFT",
      subtotal: computedSubtotal,
      taxAmount: computedTax,
      discount: computedDiscount,
      total: computedTotal,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
    },
    include: {
      client: true,
      job: { include: { property: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
