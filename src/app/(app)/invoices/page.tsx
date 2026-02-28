"use client";
import { useState, useEffect, useCallback } from "react";
import { DollarSign, ChevronRight, X, Loader2 } from "lucide-react";
import { cn, formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";

type Payment = { id: string; amount: number; method: string; paidAt: string };
type Invoice = {
  id: string; number: string; status: string;
  subtotal: number; taxAmount: number; discount: number; total: number; amountPaid: number;
  dueDate: string | null; sentAt: string | null; paidAt: string | null;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string };
  job: { id: string; number: string; property: { address: string; city: string } } | null;
  payments?: Payment[];
};

const STATUSES = ["All", "DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOID"] as const;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (invoice: Invoice) => {
    const res = await fetch(`/api/invoices/${invoice.id}`);
    if (res.ok) setSelected(await res.json());
    else setSelected(invoice);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInvoices((inv) => inv.map((i) => (i.id === id ? { ...i, status: updated.status } : i)));
      setSelected((s) => (s?.id === id ? { ...s, ...updated } : s));
    }
    setUpdatingStatus(false);
  };

  const filtered = filter === "All" ? invoices : invoices.filter((i) => i.status === filter);
  const totalRevenue = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500">{filtered.length} invoices</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-gray-400 text-xs">Revenue Collected</p>
              <p className="font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Outstanding</p>
              <p className="font-bold text-amber-600">{formatCurrency(outstanding)}</p>
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
                <DollarSign className="w-8 h-8 mb-2 text-gray-200" />
                <p className="text-sm">No invoices found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => loadDetail(inv)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors group",
                      selected?.id === inv.id && "bg-green-50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-gray-400">{inv.number}</span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[inv.status])}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {inv.client.firstName} {inv.client.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inv.job ? `Job ${inv.job.number} · ${inv.job.property.address}, ${inv.job.property.city}` : "No job linked"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                      {inv.dueDate && (
                        <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs font-mono text-gray-400">{selected.number}</p>
              <p className="font-semibold text-gray-900">
                {selected.client.firstName} {selected.client.lastName}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(["DRAFT", "SENT", "PAID", "VOID"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => !updatingStatus && updateStatus(selected.id, s)}
                    disabled={updatingStatus}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                      selected.status === s
                        ? STATUS_COLORS[s] + " border-transparent"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Amounts */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Amounts</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>{formatCurrency(selected.taxAmount)}</span>
                  </div>
                )}
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selected.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(selected.total)}</span>
                </div>
                {selected.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>{formatCurrency(selected.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-amber-600">
                      <span>Balance Due</span>
                      <span>{formatCurrency(selected.total - selected.amountPaid)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              {selected.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium text-gray-900">{formatDate(selected.dueDate)}</span>
                </div>
              )}
              {selected.sentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent</span>
                  <span className="text-gray-700">{formatDate(selected.sentAt)}</span>
                </div>
              )}
              {selected.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-gray-700">{formatDate(selected.paidAt)}</span>
                </div>
              )}
            </div>

            {/* Linked Job */}
            {selected.job && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Linked Job</p>
                <p className="text-sm font-medium text-gray-800">{selected.job.number}</p>
                <p className="text-xs text-gray-500">{selected.job.property.address}, {selected.job.property.city}</p>
              </div>
            )}

            {/* Notes */}
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}

            {/* Payments */}
            {selected.payments && selected.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment History</p>
                <div className="space-y-2">
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium text-green-800">{formatCurrency(p.amount)}</span>
                        <span className="text-green-600 ml-2 text-xs capitalize">{p.method}</span>
                      </div>
                      <span className="text-green-600 text-xs">{formatDate(p.paidAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
