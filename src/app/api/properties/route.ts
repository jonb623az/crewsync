import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeAll = req.nextUrl.searchParams.get("includeAll") === "true";

  if (includeAll) {
    const properties = await prisma.property.findMany({
      where: { companyId: session.user.companyId },
      include: {
        client: true,
        trees: { select: { id: true, treeNumber: true, species: true, status: true, lat: true, lng: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(properties);
  }

  const properties = await prisma.property.findMany({
    where: { companyId: session.user.companyId },
    include: {
      client: true,
      _count: { select: { trees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, name, address, city, state, zip, lat, lng, notes, accessNotes } = body;

  if (!clientId || !address || !city || !state || !zip) {
    return NextResponse.json(
      { error: "clientId, address, city, state, zip are required" },
      { status: 400 }
    );
  }

  const property = await prisma.property.create({
    data: {
      companyId: session.user.companyId,
      clientId,
      name: name || null,
      address,
      city,
      state,
      zip,
      lat: lat || null,
      lng: lng || null,
      notes: notes || null,
      accessNotes: accessNotes || null,
    },
    include: {
      client: true,
      _count: { select: { trees: true } },
    },
  });

  return NextResponse.json(property, { status: 201 });
}
