"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, MapPin, DollarSign, ChevronRight, Loader2 } from "lucide-react";
import { cn, formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";

type Proposal = {
  id: string; number: string; status: string; title: string | null;
  total: number; subtotal: number; createdAt: string; sentAt: string | null;
  property: { address: string; city: string; name: string | null;
    client: { firstName: string; lastName: string } };
  _count?: { items: number };
};

const STATUSES = ["All", "DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"] as const;

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  const load = useCallback(async () => {
    const res = await fetch("/api/proposals");
    if (res.ok) setProposals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "All" ? proposals : proposals.filter((p) => p.status === filter);

  const totalValue = filtered.reduce((s, p) => s + p.total, 0);
  const approvedValue = proposals.filter((p) => p.status === "APPROVED").reduce((s, p) => s + p.total, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500">{filtered.length} proposals</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-right">
            <p className="text-gray-400 text-xs">Filtered Value</p>
            <p className="font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Approved</p>
            <p className="font-bold text-green-600">{formatCurrency(approvedValue)}</p>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap",
              filter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <FileText className="w-8 h-8 mb-2 text-gray-200" />
              <p className="text-sm">No proposals found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((proposal) => (
                <div
                  key={proposal.id}
                  onClick={() => router.push(`/proposals/${proposal.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">{proposal.number}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[proposal.status])}>
                        {proposal.status}
                      </span>
                      {proposal._count && (
                        <span className="text-xs text-gray-400">{proposal._count.items} items</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {proposal.title || `${proposal.property.address}, ${proposal.property.city}`}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {proposal.property.client.firstName} {proposal.property.client.lastName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(proposal.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      {formatCurrency(proposal.total).replace("$", "")}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
