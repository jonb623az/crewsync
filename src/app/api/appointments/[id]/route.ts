import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const cid = session.user.companyId;

  const appt = await prisma.appointment.findFirst({ where: { id, companyId: cid } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    title,
    assignedToId,
    scheduledStart,
    scheduledEnd,
    status,
    notes,
    clientNotes,
    tags,
  } = body;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      ...(scheduledStart !== undefined && { scheduledStart: new Date(scheduledStart) }),
      ...(scheduledEnd !== undefined && { scheduledEnd: new Date(scheduledEnd) }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(clientNotes !== undefined && { clientNotes }),
      ...(tags !== undefined && { tags }),
    },
    include: {
      client: { select: { firstName: true, lastName: true } },
      property: { select: { address: true, city: true } },
      assignedTo: { select: { id: true, name: true } },
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
  const cid = session.user.companyId;

  const appt = await prisma.appointment.findFirst({ where: { id, companyId: cid } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
