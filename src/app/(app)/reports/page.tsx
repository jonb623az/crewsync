import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Briefcase, FileText, DollarSign, TreePine, Users } from "lucide-react";

export default async function ReportsPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) };
  }).reverse();

  const [
    jobStats,
    proposalStats,
    invoiceStats,
    treeStats,
    topClients,
    monthlyRevenue,
    teamActivity,
  ] = await Promise.all([
    // Job stats
    prisma.job.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
    // Proposal stats
    prisma.proposal.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
      _sum: { total: true },
    }),
    // Invoice stats
    prisma.invoice.aggregate({
      where: { companyId },
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
    // Tree stats
    prisma.tree.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
    }),
    // Top clients by revenue
    prisma.invoice.groupBy({
      by: ["clientId"],
      where: { companyId, status: "PAID" },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    // Monthly revenue - all invoices this year
    prisma.invoice.findMany({
      where: { companyId, status: "PAID", paidAt: { gte: startOfYear } },
      select: { total: true, paidAt: true },
    }),
    // Team job assignments
    prisma.job.groupBy({
      by: ["assignedToId"],
      where: { companyId, status: "COMPLETED" },
      _count: true,
      orderBy: { _count: { assignedToId: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch client names for top clients
  const clientIds = topClients.map((c) => c.clientId).filter(Boolean) as string[];
  const clientNames = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const clientMap = Object.fromEntries(clientNames.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

  // Fetch user names for team activity
  const userIds = teamActivity.map((t) => t.assignedToId).filter(Boolean) as string[];
  const userNames = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = Object.fromEntries(userNames.map((u) => [u.id, u.name]));

  // Compute monthly revenue buckets
  const monthlyData = last6Months.map(({ year, month, label }) => {
    const total = monthlyRevenue
      .filter((inv) => {
        const d = new Date(inv.paidAt!);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    return { label, total };
  });

  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  const totalJobs = jobStats.reduce((s, j) => s + j._count, 0);
  const completedJobs = jobStats.find((j) => j.status === "COMPLETED")?._count ?? 0;
  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const totalRevenue = invoiceStats._sum.total ?? 0;
  const totalCollected = invoiceStats._sum.amountPaid ?? 0;
  const approvedProposals = proposalStats.find((p) => p.status === "APPROVED")?._sum.total ?? 0;
  const openProposalCount = proposalStats.find((p) => p.status === "SENT")?._count ?? 0;

  const TREE_STATUS_COLOR: Record<string, string> = {
    HEALTHY: "bg-green-500",
    MONITOR: "bg-yellow-400",
    WORK_NEEDED: "bg-orange-400",
    HAZARD: "bg-red-500",
    REMOVED: "bg-gray-400",
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Business overview and analytics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${formatCurrency(totalCollected)} collected`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "Job Completion", value: `${completionRate}%`, sub: `${completedJobs} of ${totalJobs} jobs`, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Approved Pipeline", value: formatCurrency(approvedProposals ?? 0), sub: `${openProposalCount} open proposals`, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Trees", value: treeStats.reduce((s, t) => s + t._count, 0).toString(), sub: `across all properties`, icon: TreePine, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Tree Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">Revenue — Last 6 Months</h2>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map(({ label, total }) => {
              const heightPct = total === 0 ? 4 : Math.max(8, (total / maxMonthly) * 100);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{total > 0 ? formatCurrency(total).replace("$", "$") : "—"}</span>
                  <div className="w-full flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full bg-green-500 rounded-t-md transition-all hover:bg-green-600"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tree Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TreePine className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">Tree Health</h2>
          </div>
          <div className="space-y-3">
            {treeStats.map((t) => {
              const totalTrees = treeStats.reduce((s, x) => s + x._count, 0) || 1;
              const pct = Math.round((t._count / totalTrees) * 100);
              return (
                <div key={t.status}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{t.status.replace("_", " ")}</span>
                    <span>{t._count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${TREE_STATUS_COLOR[t.status] || "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {treeStats.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No trees yet</p>}
          </div>
        </div>
      </div>

      {/* Top Clients + Job Status + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Clients by Revenue</h2>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={c.clientId} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {c.clientId ? (clientMap[c.clientId] || "Unknown") : "Unknown"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(c._sum.total ?? 0)}</span>
              </div>
            ))}
            {topClients.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No paid invoices yet</p>}
          </div>
        </div>

        {/* Job Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Jobs by Status</h2>
          <div className="space-y-3">
            {jobStats.map((j) => (
              <div key={j.status} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{j.status.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-gray-100 rounded-full w-20 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(j._count / (totalJobs || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">{j._count}</span>
                </div>
              </div>
            ))}
            {jobStats.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No jobs yet</p>}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">Top Performers</h2>
          </div>
          <div className="space-y-3">
            {teamActivity.map((t, i) => (
              <div key={t.assignedToId ?? i} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                  {t.assignedToId ? (userMap[t.assignedToId] || "?")[0] : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.assignedToId ? (userMap[t.assignedToId] || "Unknown") : "Unassigned"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{t._count} jobs</span>
              </div>
            ))}
            {teamActivity.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No completed jobs yet</p>}
          </div>
        </div>
      </div>

      {/* Proposal Conversion */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Proposal Pipeline</h2>
        <div className="flex gap-4 flex-wrap">
          {proposalStats.map((p) => (
            <div key={p.status} className="flex-1 min-w-[140px] bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{p.status}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{p._count}</p>
              <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(p._sum.total ?? 0)}</p>
            </div>
          ))}
          {proposalStats.length === 0 && <p className="text-sm text-gray-400">No proposals yet</p>}
        </div>
      </div>
    </div>
  );
}
