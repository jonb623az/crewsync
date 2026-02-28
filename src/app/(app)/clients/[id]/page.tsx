"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Save, X, MapPin, TreePine } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface Property {
  id: string;
  name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  _count: { trees: number };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  properties: Property[];
  _count: { properties: number };
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-rose-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  useEffect(() => {
    fetchClient();
  }, [id]);

  async function fetchClient() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setClient(data);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        notes: data.notes || "",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setClient((c) => c ? { ...c, ...updated } : c);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading client...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-500">Client not found.</div>
    );
  }

  const initials = getInitials(client.firstName, client.lastName);
  const avatarColor = getAvatarColor(client.firstName + client.lastName);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0",
                avatarColor
              )}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Client since {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing((e) => !e)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
              editing
                ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                : "border-green-200 text-green-700 hover:bg-green-50"
            )}
          >
            {editing ? (
              <>
                <X className="w-4 h-4" /> Cancel
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" /> Edit
              </>
            )}
          </button>
        </div>

        {editing ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  maxLength={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ZIP
                </label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zip: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <InfoRow label="Phone" value={client.phone} />
              <InfoRow label="Email" value={client.email} />
            </div>
            <div className="space-y-3">
              {client.address && (
                <InfoRow
                  label="Address"
                  value={`${client.address}, ${client.city}, ${client.state} ${client.zip}`}
                />
              )}
              {client.notes && (
                <InfoRow label="Notes" value={client.notes} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Properties
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({client.properties.length})
            </span>
          </h2>
        </div>
        {client.properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
            No properties for this client yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-green-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0 group-hover:bg-green-100 transition-colors">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {property.name && (
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {property.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 truncate">
                      {property.address}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {property.city}, {property.state} {property.zip}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TreePine className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-gray-600">
                        {property._count.trees} trees
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "—"}</p>
    </div>
  );
}
