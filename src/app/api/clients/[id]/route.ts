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

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      properties: {
        include: {
          _count: { select: { trees: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { properties: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.client.update({
    where: { id },
    data: {
      firstName: body.firstName ?? client.firstName,
      lastName: body.lastName ?? client.lastName,
      phone: body.phone !== undefined ? body.phone : client.phone,
      email: body.email !== undefined ? body.email : client.email,
      address: body.address !== undefined ? body.address : client.address,
      city: body.city !== undefined ? body.city : client.city,
      state: body.state !== undefined ? body.state : client.state,
      zip: body.zip !== undefined ? body.zip : client.zip,
      notes: body.notes !== undefined ? body.notes : client.notes,
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

  const client = await prisma.client.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
