"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, Plus, X, Trash2, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  isLeader: boolean;
  user: { id: string; name: string; email: string; role: string; phone: string | null };
};
type Crew = { id: string; name: string; color: string; members: Member[] };
type User = { id: string; name: string; email: string; role: string };

const CREW_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

export default function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Crew | null>(null);
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [newCrewColor, setNewCrewColor] = useState(CREW_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const load = useCallback(async () => {
    const [crewsRes, usersRes] = await Promise.all([
      fetch("/api/crews"),
      fetch("/api/users"),
    ]);
    if (crewsRes.ok) setCrews(await crewsRes.json());
    if (usersRes.ok) setAllUsers(await usersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCrew = async () => {
    if (!newCrewName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/crews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCrewName.trim(), color: newCrewColor }),
    });
    if (res.ok) {
      const crew = await res.json();
      setCrews((c) => [...c, crew]);
      setShowNewCrew(false);
      setNewCrewName("");
      setSelected(crew);
    }
    setSaving(false);
  };

  const deleteCrew = async (id: string) => {
    if (!confirm("Delete this crew?")) return;
    await fetch(`/api/crews/${id}`, { method: "DELETE" });
    setCrews((c) => c.filter((cr) => cr.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const addMember = async () => {
    if (!selected || !selectedUserId) return;
    setAddingMember(true);
    const res = await fetch(`/api/crews/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addUserId: selectedUserId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCrews((c) => c.map((cr) => (cr.id === updated.id ? updated : cr)));
      setSelected(updated);
      setSelectedUserId("");
    }
    setAddingMember(false);
  };

  const removeMember = async (membershipId: string) => {
    if (!selected) return;
    const res = await fetch(`/api/crews/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMembershipId: membershipId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCrews((c) => c.map((cr) => (cr.id === updated.id ? updated : cr)));
      setSelected(updated);
    }
  };

  const toggleLeader = async (membershipId: string, isLeader: boolean) => {
    if (!selected) return;
    const res = await fetch(`/api/crews/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setLeader: { membershipId, isLeader } }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCrews((c) => c.map((cr) => (cr.id === updated.id ? updated : cr)));
      setSelected(updated);
    }
  };

  const memberIds = selected?.members.map((m) => m.user.id) ?? [];
  const availableUsers = allUsers.filter((u) => !memberIds.includes(u.id));

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: Crew List */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crews</h1>
            <p className="text-sm text-gray-500">{crews.length} crews</p>
          </div>
          <button
            onClick={() => setShowNewCrew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Crew
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {crews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Users className="w-8 h-8 mb-2 text-gray-200" />
                <p className="text-sm">No crews yet</p>
              </div>
            ) : (
              crews.map((crew) => (
                <div
                  key={crew.id}
                  onClick={() => setSelected(crew)}
                  className={cn(
                    "bg-white rounded-xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:border-gray-300 transition-colors",
                    selected?.id === crew.id && "border-green-400 ring-1 ring-green-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: crew.color + "20" }}
                      >
                        <Users className="w-5 h-5" style={{ color: crew.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{crew.name}</h3>
                        <p className="text-xs text-gray-500">
                          {crew.members.length} member{crew.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCrew(crew.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {crew.members.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {crew.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                          {m.isLeader && <Crown className="w-3 h-3 text-amber-500" />}
                          <span className="text-xs font-medium text-gray-700">{m.user.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Crew Detail */}
      {selected && (
        <div className="w-[360px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: selected.color + "20" }}
              >
                <Users className="w-5 h-5" style={{ color: selected.color }} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500">{selected.members.length} members</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Members */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Members</p>
              {selected.members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {selected.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                          {m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                            {m.isLeader && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <p className="text-xs text-gray-500">{m.user.role.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleLeader(m.id, !m.isLeader)}
                          title={m.isLeader ? "Remove leader" : "Make leader"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            m.isLeader
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                          )}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Member */}
            {availableUsers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Add Member</p>
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addMember}
                    disabled={!selectedUserId || addingMember}
                    className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Crew Modal */}
      {showNewCrew && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New Crew</h2>
              <button onClick={() => setShowNewCrew(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Crew Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createCrew()}
                  placeholder="e.g. Alpha Team"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CREW_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewCrewColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform",
                        newCrewColor === c ? "border-gray-900 scale-110" : "border-transparent"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCrew(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createCrew}
                disabled={!newCrewName.trim() || saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Crew"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
