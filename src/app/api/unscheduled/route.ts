import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "all";
  const cid = session.user.companyId;

  const [jobs, appointments] = await Promise.all([
    type !== "estimate"
      ? prisma.job.findMany({
          where: { companyId: cid, status: "UNSCHEDULED" },
          include: {
            property: { include: { client: true } },
            crew: { select: { id: true, name: true, color: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    type !== "job"
      ? prisma.appointment.findMany({
          where: { companyId: cid, status: "UNSCHEDULED" },
          include: {
            property: { select: { id: true, address: true, city: true, lat: true, lng: true } },
            client: { select: { id: true, firstName: true, lastName: true } },
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const items = [
    ...appointments.map((a) => ({
      id: a.id,
      type: "estimate" as const,
      title: a.title,
      clientName: a.client ? `${a.client.firstName} ${a.client.lastName}` : null,
      address: a.address ?? a.property?.address ?? null,
      city: a.city ?? a.property?.city ?? null,
      lat: a.lat ?? a.property?.lat ?? null,
      lng: a.lng ?? a.property?.lng ?? null,
      durationEst: 60,
      status: a.status,
      priority: "MEDIUM",
      tags: a.tags,
      source: a.source,
      assignedToId: a.assignedToId,
      assignedToName: a.assignedTo?.name ?? null,
      propertyId: a.propertyId,
      clientId: a.clientId,
      number: null,
      crewId: null,
      crewColor: "#8b5cf6",
    })),
    ...jobs.map((j) => ({
      id: j.id,
      type: "job" as const,
      title: j.title || `${j.property.address}`,
      clientName: `${j.property.client.firstName} ${j.property.client.lastName}`,
      address: j.property.address,
      city: j.property.city,
      lat: j.property.lat,
      lng: j.property.lng,
      durationEst: j.durationEst ?? 120,
      status: j.status,
      priority: j.priority,
      tags: null,
      source: null,
      assignedToId: j.assignedToId,
      assignedToName: null,
      propertyId: j.propertyId,
      clientId: j.property.clientId,
      number: j.number,
      crewId: j.crewId,
      crewColor: j.crew?.color ?? "#6b7280",
    })),
  ];

  return NextResponse.json(items);
}
