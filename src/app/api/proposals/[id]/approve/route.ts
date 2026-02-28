import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (proposal.status === "APPROVED") {
    return NextResponse.json({ error: "Proposal already approved" }, { status: 400 });
  }

  // Auto-generate job number
  const year = new Date().getFullYear();
  const count = await prisma.job.count({
    where: { companyId: session.user.companyId },
  });
  const jobNumber = `JOB-${year}-${String(count + 1).padStart(3, "0")}`;

  const [updatedProposal, job] = await prisma.$transaction([
    prisma.proposal.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    }),
    prisma.job.create({
      data: {
        companyId: session.user.companyId,
        propertyId: proposal.propertyId,
        proposalId: proposal.id,
        number: jobNumber,
        status: "UNSCHEDULED",
        title: proposal.title || `Job from ${proposal.number}`,
      },
    }),
  ]);

  return NextResponse.json({ proposal: updatedProposal, job });
}
