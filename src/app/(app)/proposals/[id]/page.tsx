"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn, formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";

type Tree = { id: string; treeNumber: number; species: string | null };
type Item = {
  id: string; treeId: string | null; description: string;
  quantity: number; unitPrice: number; total: number; notes: string | null;
  tree: Tree | null;
};
type Proposal = {
  id: string; number: string; status: string; title: string | null;
  notes: string | null; internalNotes: string | null;
  subtotal: number; taxRate: number; taxAmount: number; discount: number; total: number;
  validUntil: string | null; sentAt: string | null; approvedAt: string | null;
  property: { id: string; address: string; city: string; state: string; name: string | null;
    client: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null } };
  items: Item[];
};

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/proposals/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProposal(data);
      setItems(data.items);
      setNotes(data.notes || "");
      setTaxRate(data.taxRate || 0);
      setDiscount(data.discount || 0);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmt = subtotal * (taxRate / 100);
  const total = subtotal + taxAmt - discount;

  const updateItem = (idx: number, field: keyof Item, val: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === "quantity" || field === "unitPrice") {
        updated.total = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, {
    id: `new_${Date.now()}`, treeId: null, description: "", quantity: 1, unitPrice: 0, total: 0, notes: null, tree: null,
  }]);

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, notes, taxRate, discount, subtotal, taxAmount: taxAmt, total }),
    });
    setSaving(false);
    load();
  };

  const changeStatus = async (action: "send" | "approve" | "reject") => {
    setSaving(true);
    if (action === "approve") {
      await fetch(`/api/proposals/${id}/approve`, { method: "POST" });
    } else {
      const status = action === "send" ? "SENT" : "REJECTED";
      await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(action === "send" ? { sentAt: new Date().toISOString() } : { rejectedAt: new Date().toISOString() }) }),
      });
    }
    setSaving(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;
  if (!proposal) return <div className="text-center py-20 text-gray-400">Proposal not found.</div>;

  const canEdit = ["DRAFT", "SENT"].includes(proposal.status);

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.push("/proposals")} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Proposals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{proposal.number}</h1>
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_COLORS[proposal.status])}>
              {proposal.status}
            </span>
          </div>
          <p className="text-gray-500 mt-0.5">{proposal.title || "Proposal"}</p>
        </div>
        <div className="flex gap-2">
          {proposal.status === "DRAFT" && (
            <button onClick={() => changeStatus("send")} disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
              <Send className="w-4 h-4" /> Send to Client
            </button>
          )}
          {proposal.status === "SENT" && (<>
            <button onClick={() => changeStatus("reject")} disabled={saving}
              className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button onClick={() => changeStatus("approve")} disabled={saving}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </>)}
          {canEdit && (
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
            </button>
          )}
        </div>
      </div>

      {/* Property + Client card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Property</p>
          <p className="font-medium text-gray-900">{proposal.property.name || proposal.property.address}</p>
          <p className="text-sm text-gray-500">{proposal.property.address}, {proposal.property.city}, {proposal.property.state}</p>
          <button onClick={() => router.push(`/properties/${proposal.property.id}`)} className="text-xs text-green-600 hover:underline mt-1">View Property →</button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Client</p>
          <p className="font-medium text-gray-900">{proposal.property.client.firstName} {proposal.property.client.lastName}</p>
          {proposal.property.client.phone && <p className="text-sm text-gray-500">{proposal.property.client.phone}</p>}
          {proposal.property.client.email && <p className="text-sm text-gray-500">{proposal.property.client.email}</p>}
        </div>
        {proposal.validUntil && (
          <div className="col-span-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Valid until {formatDate(proposal.validUntil)}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Line Items</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="px-5 py-2.5 text-left w-12">Tree</th>
              <th className="px-3 py-2.5 text-left">Description</th>
              <th className="px-3 py-2.5 text-right w-16">Qty</th>
              <th className="px-3 py-2.5 text-right w-28">Unit Price</th>
              <th className="px-3 py-2.5 text-right w-28">Total</th>
              {canEdit && <th className="px-3 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-5 py-2.5">
                  {item.tree ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      T{item.tree.treeNumber}
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <input className="w-full text-sm border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1"
                      value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} />
                  ) : <span className="text-sm">{item.description}</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {canEdit ? (
                    <input className="w-16 text-sm text-right border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1"
                      type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} />
                  ) : <span className="text-sm">{item.quantity}</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {canEdit ? (
                    <input className="w-28 text-sm text-right border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1"
                      type="number" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} />
                  ) : <span className="text-sm">{formatCurrency(item.unitPrice)}</span>}
                </td>
                <td className="px-3 py-2.5 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                {canEdit && (
                  <td className="px-3 py-2.5">
                    <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>
        )}
      </div>

      {/* Totals + Notes */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Notes</p>
          {canEdit ? (
            <textarea className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Customer-facing notes..." />
          ) : <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes || "—"}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Tax</span>
              {canEdit ? (
                <div className="flex items-center gap-1">
                  <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-14 text-right border border-gray-200 rounded text-sm px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500" />
                  <span className="text-gray-400 text-xs">%</span>
                  <span className="text-gray-500 ml-1">{formatCurrency(taxAmt)}</span>
                </div>
              ) : <span>{taxRate}% = {formatCurrency(taxAmt)}</span>}
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Discount</span>
              {canEdit ? (
                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right border border-gray-200 rounded text-sm px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500" />
              ) : <span>-{formatCurrency(discount)}</span>}
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-green-700">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
