import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: { companyId: session.user.companyId },
    include: {
      client: { select: { firstName: true, lastName: true } },
      property: { select: { address: true, city: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    clientId,
    propertyId,
    assignedToId,
    scheduledStart,
    scheduledEnd,
    notes,
    clientNotes,
    tags,
    source,
    address,
    city,
    lat,
    lng,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      companyId: session.user.companyId,
      title,
      clientId: clientId || null,
      propertyId: propertyId || null,
      assignedToId: assignedToId || null,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      status: scheduledStart ? "SCHEDULED" : "UNSCHEDULED",
      notes: notes || null,
      clientNotes: clientNotes || null,
      tags: tags || null,
      source: source || null,
      address: address || null,
      city: city || null,
      lat: lat || null,
      lng: lng || null,
    },
    include: {
      client: { select: { firstName: true, lastName: true } },
      property: { select: { address: true, city: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
