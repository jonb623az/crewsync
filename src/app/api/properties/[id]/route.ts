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

  const property = await prisma.property.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      client: true,
      trees: { orderBy: { treeNumber: "asc" } },
      proposals: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { assignedTo: true },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: true },
      },
    },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(property);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const property = await prisma.property.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.property.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : property.name,
      address: body.address ?? property.address,
      city: body.city ?? property.city,
      state: body.state ?? property.state,
      zip: body.zip ?? property.zip,
      lat: body.lat !== undefined ? body.lat : property.lat,
      lng: body.lng !== undefined ? body.lng : property.lng,
      notes: body.notes !== undefined ? body.notes : property.notes,
      accessNotes: body.accessNotes !== undefined ? body.accessNotes : property.accessNotes,
    },
    include: { client: true },
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

  const property = await prisma.property.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
