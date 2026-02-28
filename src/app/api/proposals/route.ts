import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proposals = await prisma.proposal.findMany({
    where: { companyId: session.user.companyId },
    include: {
      property: { include: { client: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, title, notes, internalNotes, taxRate, discount, validUntil } = body;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  // Verify property belongs to the company
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Auto-generate proposal number
  const year = new Date().getFullYear();
  const count = await prisma.proposal.count({
    where: { companyId: session.user.companyId },
  });
  const number = `PRO-${year}-${String(count + 1).padStart(3, "0")}`;

  const proposal = await prisma.proposal.create({
    data: {
      companyId: session.user.companyId,
      propertyId,
      createdById: session.user.id,
      number,
      title: title || null,
      notes: notes || null,
      internalNotes: internalNotes || null,
      taxRate: taxRate || 0,
      discount: discount || 0,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
    include: {
      property: { include: { client: true } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(proposal, { status: 201 });
}
