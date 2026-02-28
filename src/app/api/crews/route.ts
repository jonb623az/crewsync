import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const crews = await prisma.crew.findMany({
    where: { companyId: session.user.companyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(crews);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const crew = await prisma.crew.create({
    data: {
      companyId: session.user.companyId,
      name: name.trim(),
      color: color || "#10b981",
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } },
      },
    },
  });

  return NextResponse.json(crew, { status: 201 });
}
