"use client";
import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrewResource, SalesResource } from "@/types";

interface Props {
  type: "estimate" | "job";
  crews: CrewResource[];
  salesUsers: SalesResource[];
  onClose: () => void;
  onCreated: () => void;
}

type Client = { id: string; firstName: string; lastName: string };
type Property = { id: string; address: string; city: string };

export default function QuickCreateModal({ type, crews, salesUsers, onClose, onCreated }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    clientId: "",
    propertyId: "",
    assignedToId: "",
    crewId: "",
    scheduledStart: "",
    scheduledEnd: "",
    durationEst: type === "estimate" ? "60" : "120",
    notes: "",
    tags: "",
    source: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!form.clientId) return setProperties([]);
    fetch(`/api/properties?clientId=${form.clientId}`)
      .then((r) => r.json())
      .then(setProperties)
      .catch(() => null);
  }, [form.clientId]);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Title is required");
    setSaving(true);
    setError("");

    try {
      const endpoint = type === "estimate" ? "/api/appointments" : "/api/jobs";
      const body =
        type === "estimate"
          ? {
              title: form.title,
              clientId: form.clientId || null,
              propertyId: form.propertyId || null,
              assignedToId: form.assignedToId || null,
              scheduledStart: form.scheduledStart || null,
              scheduledEnd: form.scheduledEnd || null,
              notes: form.notes || null,
              tags: form.tags || null,
              source: form.source || null,
            }
          : {
              title: form.title,
              propertyId: form.propertyId,
              crewId: form.crewId || null,
              durationEst: parseInt(form.durationEst) || 120,
              instructions: form.notes || null,
              priority: form.priority,
            };

      if (type === "job" && !form.propertyId) {
        setSaving(false);
        return setError("Property is required for jobs");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const isEstimate = type === "estimate";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ borderTop: `4px solid ${isEstimate ? "#8b5cf6" : "#3b82f6"}` }}
        >
          <h2 className="font-bold text-gray-900">
            {isEstimate ? "New Estimate Appointment" : "New Unscheduled Job"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <Field label="Title *">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={isEstimate ? "Estimate – Smith – Oakdale" : "Tree Removal – Johnson"}
              className={inputCls}
            />
          </Field>

          {/* Client */}
          <Field label="Client">
            <select
              value={form.clientId}
              onChange={(e) => set("clientId", e.target.value)}
              className={inputCls}
            >
              <option value="">— Select client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </Field>

          {/* Property */}
          <Field label={isEstimate ? "Property (optional)" : "Property *"}>
            <select
              value={form.propertyId}
              onChange={(e) => set("propertyId", e.target.value)}
              className={inputCls}
              disabled={!form.clientId && isEstimate}
            >
              <option value="">— Select property —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}, {p.city}
                </option>
              ))}
            </select>
          </Field>

          {/* Assignment */}
          <Field label={isEstimate ? "Assigned Arborist" : "Crew"}>
            <select
              value={isEstimate ? form.assignedToId : form.crewId}
              onChange={(e) =>
                set(isEstimate ? "assignedToId" : "crewId", e.target.value)
              }
              className={inputCls}
            >
              <option value="">— Unassigned —</option>
              {(isEstimate ? salesUsers : crews).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </Field>

          {/* Time */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start">
              <input
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => set("scheduledStart", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="End">
              <input
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(e) => set("scheduledEnd", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Duration (jobs only) */}
          {!isEstimate && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Duration (min)">
                <input
                  type="number"
                  value={form.durationEst}
                  onChange={(e) => set("durationEst", e.target.value)}
                  className={inputCls}
                  min={15}
                  step={15}
                />
              </Field>
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                  className={inputCls}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
            </div>
          )}

          {/* Tags / Source */}
          {isEstimate && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tags (comma sep)">
                <input
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="PHC, removal, HOA"
                  className={inputCls}
                />
              </Field>
              <Field label="Source">
                <select
                  value={form.source}
                  onChange={(e) => set("source", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select —</option>
                  <option value="call">Phone Call</option>
                  <option value="webform">Web Form</option>
                  <option value="referral">Referral</option>
                  <option value="repeat">Repeat Client</option>
                </select>
              </Field>
            </div>
          )}

          {/* Notes */}
          <Field label={isEstimate ? "Notes" : "Instructions"}>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="Add notes..."
            />
          </Field>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors",
              isEstimate
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create {isEstimate ? "Appointment" : "Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400";
