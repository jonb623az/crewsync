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

  const tree = await prisma.tree.findFirst({
    where: {
      id,
      property: { companyId: session.user.companyId },
    },
    include: {
      photos: { orderBy: { takenAt: "desc" } },
      proposalItems: {
        include: { proposal: true },
      },
      jobTasks: { include: { job: true } },
    },
  });

  if (!tree) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(tree);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const tree = await prisma.tree.findFirst({
    where: {
      id,
      property: { companyId: session.user.companyId },
    },
  });
  if (!tree) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.tree.update({
    where: { id },
    data: {
      species: body.species !== undefined ? body.species : tree.species,
      dbh: body.dbh !== undefined ? body.dbh : tree.dbh,
      heightEst: body.heightEst !== undefined ? body.heightEst : tree.heightEst,
      lat: body.lat !== undefined ? body.lat : tree.lat,
      lng: body.lng !== undefined ? body.lng : tree.lng,
      status: body.status !== undefined ? body.status : tree.status,
      riskRating: body.riskRating !== undefined ? body.riskRating : tree.riskRating,
      healthNotes: body.healthNotes !== undefined ? body.healthNotes : tree.healthNotes,
      workNotes: body.workNotes !== undefined ? body.workNotes : tree.workNotes,
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

  const tree = await prisma.tree.findFirst({
    where: {
      id,
      property: { companyId: session.user.companyId },
    },
  });
  if (!tree) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tree.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
