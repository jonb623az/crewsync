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

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      tasks: {
        include: { tree: true },
        orderBy: { sortOrder: "asc" },
      },
      property: { include: { client: true } },
      checkIns: {
        include: { user: true },
        orderBy: { checkedIn: "desc" },
      },
      assignedTo: true,
      proposal: true,
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(job);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.job.update({
    where: { id },
    data: {
      status: body.status !== undefined ? body.status : job.status,
      title: body.title !== undefined ? body.title : job.title,
      assignedToId: body.assignedToId !== undefined ? body.assignedToId : job.assignedToId,
      instructions: body.instructions !== undefined ? body.instructions : job.instructions,
      clientNotes: body.clientNotes !== undefined ? body.clientNotes : job.clientNotes,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : job.internalNotes,
      scheduledDate: body.scheduledDate !== undefined
        ? (body.scheduledDate ? new Date(body.scheduledDate) : null)
        : job.scheduledDate,
      scheduledStart: body.scheduledStart !== undefined
        ? (body.scheduledStart ? new Date(body.scheduledStart) : null)
        : job.scheduledStart,
      scheduledEnd: body.scheduledEnd !== undefined
        ? (body.scheduledEnd ? new Date(body.scheduledEnd) : null)
        : job.scheduledEnd,
      durationEst: body.durationEst !== undefined ? body.durationEst : job.durationEst,
      startedAt: body.status === "IN_PROGRESS" && !job.startedAt ? new Date() : job.startedAt,
      completedAt: body.status === "COMPLETED" && !job.completedAt ? new Date() : job.completedAt,
    },
    include: {
      tasks: { include: { tree: true }, orderBy: { sortOrder: "asc" } },
      property: { include: { client: true } },
      checkIns: { include: { user: true }, orderBy: { checkedIn: "desc" } },
      assignedTo: true,
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

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.job.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
