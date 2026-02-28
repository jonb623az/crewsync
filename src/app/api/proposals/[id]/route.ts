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

  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      items: {
        include: {
          tree: true,
          service: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      property: { include: { client: true } },
    },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(proposal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate totals if provided
  const subtotal = body.subtotal !== undefined ? body.subtotal : proposal.subtotal;
  const taxRate = body.taxRate !== undefined ? body.taxRate : proposal.taxRate;
  const discount = body.discount !== undefined ? body.discount : proposal.discount;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : proposal.title,
      status: body.status !== undefined ? body.status : proposal.status,
      notes: body.notes !== undefined ? body.notes : proposal.notes,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : proposal.internalNotes,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : proposal.validUntil,
      sentAt: body.status === "SENT" && !proposal.sentAt ? new Date() : proposal.sentAt,
      rejectedAt: body.status === "REJECTED" && !proposal.rejectedAt ? new Date() : proposal.rejectedAt,
    },
    include: {
      items: { include: { tree: true, service: true }, orderBy: { sortOrder: "asc" } },
      property: { include: { client: true } },
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

  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.proposal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
