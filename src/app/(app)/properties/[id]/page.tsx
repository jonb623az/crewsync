"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ArrowLeft,
  X,
  Save,
  Plus,
  TreePine,
  FileText,
  Briefcase,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate, formatCurrency, STATUS_COLORS, TREE_STATUS_PIN } from "@/lib/utils";
import Link from "next/link";

interface Tree {
  id: string;
  treeNumber: number;
  species: string | null;
  dbh: number | null;
  heightEst: number | null;
  lat: number;
  lng: number;
  status: string;
  riskRating: string;
  healthNotes: string | null;
  workNotes: string | null;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

interface Proposal {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  _count?: { items: number };
}

interface Job {
  id: string;
  number: string;
  title: string | null;
  status: string;
  scheduledDate: string | null;
  assignedTo?: { name: string } | null;
}

interface ActivityLog {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  user?: { name: string } | null;
}

interface Property {
  id: string;
  name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  accessNotes: string | null;
  client: Client;
  trees: Tree[];
  proposals: Proposal[];
  jobs: Job[];
  activityLogs: ActivityLog[];
}

type Tab = "overview" | "trees" | "proposals" | "jobs" | "history";

const TREE_STATUSES = ["HEALTHY", "MONITOR", "WORK_NEEDED", "HAZARD", "REMOVED"];
const RISK_RATINGS = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [addTreeMode, setAddTreeMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingMarker, setPendingMarker] = useState<mapboxgl.Marker | null>(null);

  // Overview edit
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    accessNotes: "",
    notes: "",
  });
  const [savingOverview, setSavingOverview] = useState(false);

  // Tree edit
  const [treeForm, setTreeForm] = useState({
    species: "",
    dbh: "",
    heightEst: "",
    status: "HEALTHY",
    riskRating: "LOW",
    healthNotes: "",
    workNotes: "",
  });
  const [savingTree, setSavingTree] = useState(false);

  // Add tree mini form
  const [addTreeForm, setAddTreeForm] = useState({
    species: "",
    dbh: "",
  });
  const [savingNewTree, setSavingNewTree] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${id}`);
      const data = await res.json();
      setProperty(data);
      setOverviewForm({
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        accessNotes: data.accessNotes || "",
        notes: data.notes || "",
      });
    } finally {
      setLoading(false);
    }
  }

  const renderMarkers = useCallback((map: mapboxgl.Map, trees: Tree[], onSelect: (t: Tree) => void) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    trees.forEach((tree) => {
      if (!tree.lat || !tree.lng) return;
      const el = document.createElement("div");
      el.className = "tree-marker";
      const color = TREE_STATUS_PIN[tree.status] || "#22c55e";
      el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);`;
      el.textContent = String(tree.treeNumber);
      el.onclick = () => onSelect(tree);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([tree.lng, tree.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !property) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [property.lng || -122.6765, property.lat || 45.5231],
      zoom: 18,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstanceRef.current = map;

    map.on("load", () => {
      renderMarkers(map, property.trees, (tree) => {
        setSelectedTree(tree);
        setTreeForm({
          species: tree.species || "",
          dbh: tree.dbh ? String(tree.dbh) : "",
          heightEst: tree.heightEst ? String(tree.heightEst) : "",
          status: tree.status,
          riskRating: tree.riskRating,
          healthNotes: tree.healthNotes || "",
          workNotes: tree.workNotes || "",
        });
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [property?.id]);

  // Re-render markers when trees change
  useEffect(() => {
    if (!mapInstanceRef.current || !property) return;
    const map = mapInstanceRef.current;
    if (!map.loaded()) return;
    renderMarkers(map, property.trees, (tree) => {
      setSelectedTree(tree);
      setTreeForm({
        species: tree.species || "",
        dbh: tree.dbh ? String(tree.dbh) : "",
        heightEst: tree.heightEst ? String(tree.heightEst) : "",
        status: tree.status,
        riskRating: tree.riskRating,
        healthNotes: tree.healthNotes || "",
        workNotes: tree.workNotes || "",
      });
    });
  }, [property?.trees]);

  // Add tree map click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!addTreeMode) return;

      // Remove previous pending marker
      if (pendingMarker) pendingMarker.remove();

      const { lng, lat } = e.lngLat;
      const el = document.createElement("div");
      el.style.cssText = `width:28px;height:28px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);`;
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
      setPendingMarker(marker);
      setPendingPin({ lat, lng });
    };

    map.on("click", handleClick);
    if (addTreeMode) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    return () => {
      map.off("click", handleClick);
    };
  }, [addTreeMode, pendingMarker]);

  async function handleSaveTree() {
    if (!selectedTree) return;
    setSavingTree(true);
    try {
      const res = await fetch(`/api/trees/${selectedTree.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: treeForm.species || null,
          dbh: treeForm.dbh ? parseFloat(treeForm.dbh) : null,
          heightEst: treeForm.heightEst ? parseFloat(treeForm.heightEst) : null,
          status: treeForm.status,
          riskRating: treeForm.riskRating,
          healthNotes: treeForm.healthNotes || null,
          workNotes: treeForm.workNotes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tree");
      const updated = await res.json();
      setProperty((p) =>
        p
          ? {
              ...p,
              trees: p.trees.map((t) => (t.id === updated.id ? updated : t)),
            }
          : p
      );
      setSelectedTree(updated);
    } finally {
      setSavingTree(false);
    }
  }

  async function handleAddTree() {
    if (!pendingPin) return;
    setSavingNewTree(true);
    try {
      const res = await fetch("/api/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          lat: pendingPin.lat,
          lng: pendingPin.lng,
          species: addTreeForm.species || null,
          dbh: addTreeForm.dbh ? parseFloat(addTreeForm.dbh) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add tree");
      const newTree = await res.json();
      setProperty((p) => (p ? { ...p, trees: [...p.trees, newTree] } : p));
      setAddTreeMode(false);
      setPendingPin(null);
      if (pendingMarker) pendingMarker.remove();
      setPendingMarker(null);
      setAddTreeForm({ species: "", dbh: "" });
    } finally {
      setSavingNewTree(false);
    }
  }

  async function handleSaveOverview() {
    setSavingOverview(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overviewForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setProperty((p) => (p ? { ...p, ...updated } : p));
      setEditingOverview(false);
    } finally {
      setSavingOverview(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12 text-gray-500">Property not found.</div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <MapPin className="w-4 h-4" /> },
    { key: "trees", label: `Trees (${property.trees.length})`, icon: <TreePine className="w-4 h-4" /> },
    { key: "proposals", label: `Proposals (${property.proposals.length})`, icon: <FileText className="w-4 h-4" /> },
    { key: "jobs", label: `Jobs (${property.jobs.length})`, icon: <Briefcase className="w-4 h-4" /> },
    { key: "history", label: "History", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Properties
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">
            {property.name || `${property.address}, ${property.city}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAddTreeMode((m) => !m);
              if (addTreeMode) {
                if (pendingMarker) pendingMarker.remove();
                setPendingPin(null);
                setPendingMarker(null);
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
              addTreeMode
                ? "bg-green-600 text-white border-green-600"
                : "border-green-200 text-green-700 hover:bg-green-50"
            )}
          >
            <Plus className="w-4 h-4" />
            {addTreeMode ? "Click map to place tree" : "Add Tree"}
          </button>
        </div>
      </div>

      {/* Main Layout: Map + Panel */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Map - 60% */}
        <div className="relative flex-[3] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Add Tree floating form */}
          {addTreeMode && pendingPin && (
            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72 z-10">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                New Tree at Pin
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Species (optional)"
                  value={addTreeForm.species}
                  onChange={(e) =>
                    setAddTreeForm((f) => ({ ...f, species: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="DBH in inches (optional)"
                  value={addTreeForm.dbh}
                  onChange={(e) =>
                    setAddTreeForm((f) => ({ ...f, dbh: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setAddTreeMode(false);
                    if (pendingMarker) pendingMarker.remove();
                    setPendingPin(null);
                    setPendingMarker(null);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTree}
                  disabled={savingNewTree}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {savingNewTree ? "Adding..." : "Add Tree"}
                </button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-sm border border-gray-200 p-3 z-10">
            <p className="text-xs font-semibold text-gray-600 mb-2">Tree Status</p>
            <div className="space-y-1">
              {TREE_STATUSES.filter((s) => s !== "REMOVED").map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ background: TREE_STATUS_PIN[s] }}
                  />
                  <span className="text-xs text-gray-600">{s.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - 40% */}
        <div className="flex-[2] flex flex-col min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-green-500 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Property Details
                  </h3>
                  <button
                    onClick={() => setEditingOverview((e) => !e)}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    {editingOverview ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editingOverview ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={overviewForm.name}
                        onChange={(e) =>
                          setOverviewForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={overviewForm.address}
                        onChange={(e) =>
                          setOverviewForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={overviewForm.city}
                        onChange={(e) =>
                          setOverviewForm((f) => ({ ...f, city: e.target.value }))
                        }
                        placeholder="City"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={overviewForm.state}
                        onChange={(e) =>
                          setOverviewForm((f) => ({
                            ...f,
                            state: e.target.value,
                          }))
                        }
                        placeholder="State"
                        maxLength={2}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={overviewForm.zip}
                        onChange={(e) =>
                          setOverviewForm((f) => ({ ...f, zip: e.target.value }))
                        }
                        placeholder="ZIP"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Access Notes
                      </label>
                      <textarea
                        value={overviewForm.accessNotes}
                        onChange={(e) =>
                          setOverviewForm((f) => ({
                            ...f,
                            accessNotes: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveOverview}
                      disabled={savingOverview}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingOverview ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <OverviewRow
                      label="Address"
                      value={`${property.address}, ${property.city}, ${property.state} ${property.zip}`}
                    />
                    {property.accessNotes && (
                      <OverviewRow
                        label="Access Notes"
                        value={property.accessNotes}
                      />
                    )}
                    {property.notes && (
                      <OverviewRow label="Notes" value={property.notes} />
                    )}
                  </div>
                )}

                {/* Client Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Client
                  </h3>
                  <Link
                    href={`/clients/${property.client.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                      {property.client.firstName[0]}
                      {property.client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {property.client.firstName} {property.client.lastName}
                      </p>
                      {property.client.phone && (
                        <p className="text-xs text-gray-500">
                          {property.client.phone}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                </div>
              </div>
            )}

            {/* Trees Tab */}
            {activeTab === "trees" && (
              <div className="space-y-2">
                {property.trees.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No trees yet. Use "Add Tree" to place trees on the map.
                  </div>
                ) : (
                  property.trees.map((tree) => (
                    <button
                      key={tree.id}
                      onClick={() => {
                        setSelectedTree(tree);
                        setTreeForm({
                          species: tree.species || "",
                          dbh: tree.dbh ? String(tree.dbh) : "",
                          heightEst: tree.heightEst ? String(tree.heightEst) : "",
                          status: tree.status,
                          riskRating: tree.riskRating,
                          healthNotes: tree.healthNotes || "",
                          workNotes: tree.workNotes || "",
                        });
                        // Fly to tree
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo({
                            center: [tree.lng, tree.lat],
                            zoom: 19,
                          });
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-white shadow-sm"
                        style={{
                          background:
                            TREE_STATUS_PIN[tree.status] || "#22c55e",
                        }}
                      >
                        {tree.treeNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          T{tree.treeNumber}{" "}
                          {tree.species && (
                            <span className="font-normal text-gray-600">
                              — {tree.species}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tree.dbh ? `${tree.dbh}" DBH` : "No DBH"} •{" "}
                          {tree.status.replace("_", " ")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[tree.status] ||
                            "bg-gray-100 text-gray-600"
                        )}
                      >
                        {tree.status.replace("_", " ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === "proposals" && (
              <div className="space-y-2">
                {property.proposals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No proposals for this property.
                  </div>
                ) : (
                  property.proposals.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {proposal.number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(proposal.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(proposal.total)}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            STATUS_COLORS[proposal.status] ||
                              "bg-gray-100 text-gray-600"
                          )}
                        >
                          {proposal.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === "jobs" && (
              <div className="space-y-2">
                {property.jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No jobs for this property.
                  </div>
                ) : (
                  property.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {job.number}
                          {job.title && (
                            <span className="font-normal text-gray-600 ml-1">
                              — {job.title}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.scheduledDate
                            ? formatDate(job.scheduledDate)
                            : "Not scheduled"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[job.status] ||
                            "bg-gray-100 text-gray-600"
                        )}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-1">
                {property.activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-3">
                      {property.activityLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 relative">
                          <div className="w-8 h-8 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                            <Clock className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm text-gray-800 font-medium">
                              {log.action}
                            </p>
                            {log.detail && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {log.detail}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {log.user?.name || "System"} •{" "}
                              {formatDate(log.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tree Detail Drawer */}
      {selectedTree && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setSelectedTree(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-xl z-50 flex flex-col border-l border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm"
                  style={{
                    background:
                      TREE_STATUS_PIN[selectedTree.status] || "#22c55e",
                  }}
                >
                  T{selectedTree.treeNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Tree #{selectedTree.treeNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedTree.species || "Unknown species"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTree(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Species
                  </label>
                  <input
                    type="text"
                    value={treeForm.species}
                    onChange={(e) =>
                      setTreeForm((f) => ({ ...f, species: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Douglas Fir"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    DBH (inches)
                  </label>
                  <input
                    type="number"
                    value={treeForm.dbh}
                    onChange={(e) =>
                      setTreeForm((f) => ({ ...f, dbh: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Height Estimate (ft)
                  </label>
                  <input
                    type="number"
                    value={treeForm.heightEst}
                    onChange={(e) =>
                      setTreeForm((f) => ({
                        ...f,
                        heightEst: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={treeForm.status}
                  onChange={(e) =>
                    setTreeForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {TREE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Risk Rating
                </label>
                <select
                  value={treeForm.riskRating}
                  onChange={(e) =>
                    setTreeForm((f) => ({ ...f, riskRating: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {RISK_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Health Notes
                </label>
                <textarea
                  value={treeForm.healthNotes}
                  onChange={(e) =>
                    setTreeForm((f) => ({
                      ...f,
                      healthNotes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Notes on tree health, disease, structural issues..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work Notes
                </label>
                <textarea
                  value={treeForm.workNotes}
                  onChange={(e) =>
                    setTreeForm((f) => ({ ...f, workNotes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Work to be performed, priority notes..."
                />
              </div>

              {/* Photos placeholder */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Photos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to Proposal */}
              <div className="pt-2 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  Add to Proposal
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleSaveTree}
                disabled={savingTree}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {savingTree ? "Saving..." : "Save Tree"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
