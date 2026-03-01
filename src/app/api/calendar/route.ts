import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const cid = session.user.companyId;

  const [jobs, appointments] = await Promise.all([
    prisma.job.findMany({
      where: {
        companyId: cid,
        status: { notIn: ["UNSCHEDULED", "CANCELLED"] },
        scheduledStart: { gte: startDate, lte: endDate },
      },
      include: {
        property: { include: { client: true } },
        assignedTo: { select: { id: true, name: true } },
        crew: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        companyId: cid,
        status: { notIn: ["UNSCHEDULED", "CANCELED"] },
        scheduledStart: { gte: startDate, lte: endDate },
      },
      include: {
        property: { select: { id: true, address: true, city: true, lat: true, lng: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
  ]);

  const events = [
    ...jobs.map((j) => ({
      id: j.id,
      type: "job" as const,
      title: j.title || `${j.property.address}`,
      start: j.scheduledStart,
      end: j.scheduledEnd,
      resourceId: j.crewId,
      status: j.status,
      priority: j.priority,
      crewId: j.crewId,
      crewName: j.crew?.name ?? null,
      crewColor: j.crew?.color ?? "#6b7280",
      assignedToId: j.assignedToId,
      assignedToName: j.assignedTo?.name ?? null,
      propertyId: j.propertyId,
      clientId: j.property.clientId ?? null,
      clientName: `${j.property.client.firstName} ${j.property.client.lastName}`,
      address: j.property.address,
      city: j.property.city,
      lat: j.property.lat,
      lng: j.property.lng,
      durationEst: j.durationEst,
      instructions: j.instructions,
      hazardNotes: j.hazardNotes,
      equipmentNeeds: j.equipmentNeeds,
      number: j.number,
    })),
    ...appointments.map((a) => ({
      id: a.id,
      type: "estimate" as const,
      title: a.title,
      start: a.scheduledStart,
      end: a.scheduledEnd,
      resourceId: a.assignedToId,
      status: a.status,
      priority: "MEDIUM",
      crewId: null,
      crewName: null,
      crewColor: "#8b5cf6",
      assignedToId: a.assignedToId,
      assignedToName: a.assignedTo?.name ?? null,
      propertyId: a.propertyId,
      clientId: a.clientId,
      clientName: a.client ? `${a.client.firstName} ${a.client.lastName}` : null,
      address: a.address ?? a.property?.address ?? null,
      city: a.city ?? a.property?.city ?? null,
      lat: a.lat ?? a.property?.lat ?? null,
      lng: a.lng ?? a.property?.lng ?? null,
      durationEst: null,
      instructions: a.notes,
      hazardNotes: null,
      equipmentNeeds: null,
      number: null,
      tags: a.tags,
      source: a.source,
    })),
  ];

  return NextResponse.json(events);
}
