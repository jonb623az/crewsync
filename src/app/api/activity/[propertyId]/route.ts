import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { propertyId } = await params;

  // Verify property belongs to the company
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const logs = await prisma.activityLog.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: true },
  });

  return NextResponse.json(logs);
}
