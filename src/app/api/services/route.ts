import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.serviceCatalog.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, unitPrice, unit, taxable } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const service = await prisma.serviceCatalog.create({
    data: {
      companyId: session.user.companyId,
      name: name.trim(),
      description: description || null,
      unitPrice: unitPrice ?? 0,
      unit: unit || "each",
      taxable: taxable !== false,
      active: true,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
