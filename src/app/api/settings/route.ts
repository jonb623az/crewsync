import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
  });

  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, address, city, state, zip, logoUrl } = body;

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
  });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const updated = await prisma.company.update({
    where: { id: session.user.companyId },
    data: {
      name: name !== undefined ? name : company.name,
      phone: phone !== undefined ? phone : company.phone,
      email: email !== undefined ? email : company.email,
      address: address !== undefined ? address : company.address,
      city: city !== undefined ? city : company.city,
      state: state !== undefined ? state : company.state,
      zip: zip !== undefined ? zip : company.zip,
      logoUrl: logoUrl !== undefined ? logoUrl : company.logoUrl,
    },
  });

  return NextResponse.json(updated);
}
