import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DispatchPlanner from "@/components/dispatch/DispatchPlanner";

export const metadata = { title: "Dispatch Planner — CrewSync" };

export default async function DispatchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const cid = session.user.companyId;

  const [crews, salesUsers] = await Promise.all([
    prisma.crew.findMany({
      where: { companyId: cid },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        companyId: cid,
        active: true,
        role: { in: ["OWNER", "OFFICE_MANAGER", "SALES_ARBORIST"] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const crewResources = crews.map((c) => ({
    id: c.id,
    title: c.name,
    color: c.color,
  }));

  const salesResources = salesUsers.map((u) => ({
    id: u.id,
    title: u.name,
  }));

  return (
    <DispatchPlanner
      crews={crewResources}
      salesUsers={salesResources}
    />
  );
}
