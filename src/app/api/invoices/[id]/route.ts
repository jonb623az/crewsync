import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      client: true,
      job: { include: { property: true } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subtotal = body.subtotal !== undefined ? body.subtotal : invoice.subtotal;
  const taxAmount = body.taxAmount !== undefined ? body.taxAmount : invoice.taxAmount;
  const discount = body.discount !== undefined ? body.discount : invoice.discount;
  const total = subtotal + taxAmount - discount;

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: body.status !== undefined ? body.status : invoice.status,
      subtotal,
      taxAmount,
      discount,
      total,
      amountPaid: body.amountPaid !== undefined ? body.amountPaid : invoice.amountPaid,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : invoice.dueDate,
      notes: body.notes !== undefined ? body.notes : invoice.notes,
      sentAt: body.status === "SENT" && !invoice.sentAt ? new Date() : invoice.sentAt,
      paidAt: body.status === "PAID" && !invoice.paidAt ? new Date() : invoice.paidAt,
    },
    include: {
      client: true,
      job: { include: { property: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
