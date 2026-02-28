import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const crewInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const crew = await prisma.crew.findFirst({
    where: { id, companyId: session.user.companyId },
    include: crewInclude,
  });

  if (!crew) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(crew);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const crew = await prisma.crew.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!crew) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Add a member
  if (body.addUserId) {
    const user = await prisma.user.findFirst({
      where: { id: body.addUserId, companyId: session.user.companyId },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.crewMembership.upsert({
      where: { crewId_userId: { crewId: id, userId: body.addUserId } },
      create: { crewId: id, userId: body.addUserId, isLeader: false },
      update: {},
    });
  }

  // Remove a member
  if (body.removeMembershipId) {
    await prisma.crewMembership.deleteMany({
      where: { id: body.removeMembershipId, crewId: id },
    });
  }

  // Toggle leader
  if (body.setLeader) {
    await prisma.crewMembership.update({
      where: { id: body.setLeader.membershipId },
      data: { isLeader: body.setLeader.isLeader },
    });
  }

  // Update name/color
  if (body.name !== undefined || body.color !== undefined) {
    await prisma.crew.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : crew.name,
        color: body.color !== undefined ? body.color : crew.color,
      },
    });
  }

  const updated = await prisma.crew.findFirst({
    where: { id },
    include: crewInclude,
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

  const crew = await prisma.crew.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!crew) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.crewMembership.deleteMany({ where: { crewId: id } });
  await prisma.crew.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
