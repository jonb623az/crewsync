import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  FileText,
  Briefcase,
  CheckCircle,
  DollarSign,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    openProposalsCount,
    pendingJobsCount,
    completedThisMonthCount,
    revenueThisMonth,
    recentJobs,
    recentProposals,
  ] = await Promise.all([
    prisma.proposal.count({
      where: { companyId, status: { in: ["DRAFT", "SENT"] } },
    }),
    prisma.job.count({
      where: { companyId, status: { in: ["UNSCHEDULED", "SCHEDULED", "DISPATCHED"] } },
    }),
    prisma.job.count({
      where: {
        companyId,
        status: "COMPLETED",
        completedAt: { gte: startOfMonth },
      },
    }),
    prisma.invoice.aggregate({
      where: {
        companyId,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        property: { include: { client: true } },
        assignedTo: true,
      },
    }),
    prisma.proposal.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        property: { include: { client: true } },
      },
    }),
  ]);

  const revenue = revenueThisMonth._sum.total ?? 0;

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Open Proposals",
      value: openProposalsCount,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Jobs",
      value: pendingJobsCount,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Completed This Month",
      value: completedThisMonthCount,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {session!.user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4"
            >
              <div className={cn("p-3 rounded-lg", stat.bg)}>
                <Icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Jobs</h2>
          <a
            href="/jobs"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3">Job #</th>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Scheduled</th>
                <th className="px-6 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <a
                      href={`/jobs`}
                      className="font-mono text-sm font-medium text-gray-900 hover:text-green-600"
                    >
                      {job.number}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {job.property.address}, {job.property.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {job.property.client.firstName} {job.property.client.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.scheduledDate
                      ? formatDate(job.scheduledDate)
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.assignedTo?.name || "—"}
                  </td>
                </tr>
              ))}
              {recentJobs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No jobs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Proposals
          </h2>
          <a
            href="/proposals"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3">Proposal #</th>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentProposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <a
                      href={`/proposals/${proposal.id}`}
                      className="font-mono text-sm font-medium text-gray-900 hover:text-green-600"
                    >
                      {proposal.number}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {proposal.property.address}, {proposal.property.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {proposal.property.client.firstName}{" "}
                    {proposal.property.client.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(proposal.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        STATUS_COLORS[proposal.status] ||
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(proposal.createdAt)}
                  </td>
                </tr>
              ))}
              {recentProposals.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No proposals yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
