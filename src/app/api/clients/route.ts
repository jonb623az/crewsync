import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { lastName: "asc" },
    include: {
      _count: { select: { properties: true } },
    },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, phone, email, address, city, state, zip, notes } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "firstName and lastName are required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      companyId: session.user.companyId,
      firstName,
      lastName,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
