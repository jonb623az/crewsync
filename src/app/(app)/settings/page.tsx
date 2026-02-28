"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, Building2, Users, Bell, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type Company = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; city: string | null; state: string | null; zip: string | null;
};
type User = {
  id: string; name: string; email: string; role: string; phone: string | null; active: boolean;
};

type Tab = "company" | "team" | "notifications" | "services";

const ROLES = ["OWNER", "OFFICE_MANAGER", "SALES_ARBORIST", "CREW_LEADER", "CREW_MEMBER"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", state: "", zip: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/users")]).then(async ([cs, us]) => {
      if (cs.ok) {
        const c: Company = await cs.json();
        setCompany(c);
        setForm({
          name: c.name || "",
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          zip: c.zip || "",
        });
      }
      if (us.ok) setUsers(await us.json());
      setLoading(false);
    });
  }, []);

  const saveCompany = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setCompany(await res.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const TABS = [
    { key: "company" as Tab, label: "Company", icon: Building2 },
    { key: "team" as Tab, label: "Team", icon: Users },
    { key: "notifications" as Tab, label: "Notifications", icon: Bell },
    { key: "services" as Tab, label: "Services", icon: Wrench },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your company and account preferences</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-green-500 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {tab === "company" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Company Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveCompany}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
            <span className="text-sm text-gray-500">{users.length} members</span>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      {!user.active && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {user.role.replace(/_/g, " ")}
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No team members</div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { label: "Job Scheduled", description: "Get notified when a new job is scheduled" },
              { label: "Proposal Approved", description: "Get notified when a client approves a proposal" },
              { label: "Invoice Overdue", description: "Get notified when an invoice becomes overdue" },
              { label: "New Client", description: "Get notified when a new client is added" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {tab === "services" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Service Catalog</h2>
            <p className="text-xs text-gray-500 mt-1">Services available when building proposals</p>
          </div>
          <ServiceCatalogList />
        </div>
      )}
    </div>
  );
}

function ServiceCatalogList() {
  const [services, setServices] = useState<{ id: string; name: string; unitPrice: number; unit: string; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services").then(async (res) => {
      if (res.ok) setServices(await res.json());
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="divide-y divide-gray-50">
      {services.map((s) => (
        <div key={s.id} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{s.name}</p>
            <p className="text-xs text-gray-500">{s.unit}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">${s.unitPrice.toFixed(2)}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
              {s.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      ))}
      {services.length === 0 && (
        <div className="p-6 text-center text-sm text-gray-400">No services yet</div>
      )}
    </div>
  );
}
