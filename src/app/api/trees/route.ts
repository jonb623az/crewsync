import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, lat, lng, species, dbh, heightEst, status, riskRating, healthNotes, workNotes } = body;

  if (!propertyId || lat === undefined || lng === undefined) {
    return NextResponse.json(
      { error: "propertyId, lat, and lng are required" },
      { status: 400 }
    );
  }

  // Verify property belongs to the company
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Auto-assign treeNumber = max + 1
  const maxResult = await prisma.tree.aggregate({
    where: { propertyId },
    _max: { treeNumber: true },
  });
  const nextNumber = (maxResult._max.treeNumber ?? 0) + 1;

  const tree = await prisma.tree.create({
    data: {
      propertyId,
      treeNumber: nextNumber,
      lat,
      lng,
      species: species || null,
      dbh: dbh || null,
      heightEst: heightEst || null,
      status: status || "HEALTHY",
      riskRating: riskRating || "LOW",
      healthNotes: healthNotes || null,
      workNotes: workNotes || null,
    },
  });

  return NextResponse.json(tree, { status: 201 });
}
