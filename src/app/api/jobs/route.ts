import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { companyId: session.user.companyId },
    include: {
      property: { include: { client: true } },
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    propertyId,
    proposalId,
    assignedToId,
    title,
    instructions,
    clientNotes,
    internalNotes,
    scheduledDate,
    scheduledStart,
    scheduledEnd,
    durationEst,
  } = body;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const year = new Date().getFullYear();
  const count = await prisma.job.count({
    where: { companyId: session.user.companyId },
  });
  const number = `JOB-${year}-${String(count + 1).padStart(3, "0")}`;

  const job = await prisma.job.create({
    data: {
      companyId: session.user.companyId,
      propertyId,
      proposalId: proposalId || null,
      assignedToId: assignedToId || null,
      number,
      status: "UNSCHEDULED",
      title: title || null,
      instructions: instructions || null,
      clientNotes: clientNotes || null,
      internalNotes: internalNotes || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      durationEst: durationEst || null,
    },
    include: {
      property: { include: { client: true } },
      assignedTo: true,
    },
  });

  return NextResponse.json(job, { status: 201 });
}
