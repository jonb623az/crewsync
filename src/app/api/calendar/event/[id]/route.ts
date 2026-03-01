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
  const { type, start, end, crewId, assignedToId, status } = body;
  const cid = session.user.companyId;

  if (type === "job") {
    const job = await prisma.job.findFirst({ where: { id, companyId: cid } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(start !== undefined && { scheduledStart: new Date(start) }),
        ...(end !== undefined && { scheduledEnd: new Date(end) }),
        ...(start !== undefined && { scheduledDate: new Date(start) }),
        ...(crewId !== undefined && { crewId: crewId || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(status !== undefined && { status }),
        // When scheduling from unscheduled queue, mark as SCHEDULED
        ...(start !== undefined && job.status === "UNSCHEDULED" && { status: "SCHEDULED" }),
      },
      include: {
        property: { include: { client: true } },
        crew: { select: { id: true, name: true, color: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        propertyId: updated.propertyId,
        userId: session.user.id,
        action: "JOB_SCHEDULED",
        detail: `Job ${updated.number} scheduled to ${updated.scheduledStart?.toISOString()}`,
      },
    }).catch(() => null);

    return NextResponse.json(updated);
  } else {
    const appt = await prisma.appointment.findFirst({ where: { id, companyId: cid } });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(start !== undefined && { scheduledStart: new Date(start) }),
        ...(end !== undefined && { scheduledEnd: new Date(end) }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(status !== undefined && { status }),
        ...(start !== undefined && appt.status === "UNSCHEDULED" && { status: "SCHEDULED" }),
      },
      include: {
        property: { select: { id: true, address: true, city: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  }
}
