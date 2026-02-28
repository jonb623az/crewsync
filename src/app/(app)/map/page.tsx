"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, MapPin, TreePine, ChevronRight } from "lucide-react";
import { cn, STATUS_COLORS, TREE_STATUS_PIN } from "@/lib/utils";
import Link from "next/link";

type Tree = { id: string; treeNumber: number; species: string | null; status: string; lat: number; lng: number };
type Property = {
  id: string; name: string | null; address: string; city: string; state: string;
  lat: number | null; lng: number | null;
  client: { firstName: string; lastName: string };
  trees: Tree[];
  _count?: { trees: number };
};

const PROPERTY_PIN_COLOR = "#3b82f6";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);
  const [view, setView] = useState<"properties" | "trees">("properties");

  useEffect(() => {
    fetch("/api/properties?includeAll=true")
      .then(async (res) => {
        if (res.ok) setProperties(await res.json());
        setLoading(false);
      });
  }, []);

  const renderMarkers = useCallback(
    (map: mapboxgl.Map, props: Property[], onSelect: (p: Property) => void) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      props.forEach((property) => {
        if (!property.lat || !property.lng) return;

        if (view === "trees" && property.trees.length > 0) {
          // Render individual tree markers
          property.trees.forEach((tree) => {
            const el = document.createElement("div");
            const color = TREE_STATUS_PIN[tree.status] || "#22c55e";
            el.style.cssText = `width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);`;
            el.textContent = String(tree.treeNumber);
            el.onclick = () => onSelect(property);

            const marker = new mapboxgl.Marker(el)
              .setLngLat([tree.lng, tree.lat])
              .addTo(map);
            markersRef.current.push(marker);
          });
        } else {
          // Render property marker
          const el = document.createElement("div");
          const treeCount = property.trees.length;
          const hazardCount = property.trees.filter((t) => t.status === "HAZARD").length;
          const pinColor = hazardCount > 0 ? "#ef4444" : PROPERTY_PIN_COLOR;

          el.style.cssText = `min-width:32px;height:32px;border-radius:16px;background:${pinColor};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);padding:0 8px;gap:4px;`;
          el.innerHTML = `<span style="font-size:12px">🌳</span>${treeCount > 0 ? `<span>${treeCount}</span>` : ""}`;
          el.title = `${property.address}, ${property.city}`;
          el.onclick = () => onSelect(property);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([property.lng, property.lat])
            .addTo(map);
          markersRef.current.push(marker);
        }
      });
    },
    [view]
  );

  useEffect(() => {
    if (!mapRef.current || loading) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const validProps = properties.filter((p) => p.lat && p.lng);
    const center: [number, number] =
      validProps.length > 0
        ? [validProps[0].lng!, validProps[0].lat!]
        : [-122.6765, 45.5231];

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstanceRef.current = map;

    map.on("load", () => {
      renderMarkers(map, properties, (p) => setSelected(p));
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [loading, properties.length]);

  // Re-render markers when view toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.loaded()) return;
    renderMarkers(map, properties, (p) => setSelected(p));
  }, [view, properties, renderMarkers]);

  const flyTo = (lat: number, lng: number, zoom = 16) => {
    mapInstanceRef.current?.flyTo({ center: [lng, lat], zoom, speed: 1.2 });
  };

  const propsWithLocation = properties.filter((p) => p.lat && p.lng);
  const propsWithoutLocation = properties.filter((p) => !p.lat || !p.lng);

  return (
    <div className="flex h-[calc(100vh-96px)] gap-0 -mx-6 -mt-2">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900">Property Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">{propsWithLocation.length} properties mapped</p>

          <div className="flex gap-1 mt-3 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView("properties")}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                view === "properties" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Properties
            </button>
            <button
              onClick={() => setView("trees")}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                view === "trees" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Trees
            </button>
          </div>
        </div>

        {/* Property List */}
        <div className="flex-1 overflow-y-auto">
          {propsWithLocation.map((property) => (
            <button
              key={property.id}
              onClick={() => {
                setSelected(property);
                flyTo(property.lat!, property.lng!);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50",
                selected?.id === property.id && "bg-green-50 border-green-100"
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {property.name || property.address}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {property.client.firstName} {property.client.lastName} · {property.trees.length} trees
                </p>
              </div>
              {property.trees.some((t) => t.status === "HAZARD") && (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">!</span>
              )}
            </button>
          ))}
          {propsWithoutLocation.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium">{propsWithoutLocation.length} properties not yet geocoded</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tree Status</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(TREE_STATUS_PIN).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-gray-500">{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Property Detail Card */}
        {selected && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.name || selected.address}</p>
                <p className="text-xs text-gray-500">{selected.city}, {selected.state}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Client</span>
                <span className="font-medium text-gray-900">{selected.client.firstName} {selected.client.lastName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Trees</span>
                <span className="font-medium text-gray-900">{selected.trees.length}</span>
              </div>

              {selected.trees.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trees</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selected.trees.map((tree) => (
                      <div key={tree.id} className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: TREE_STATUS_PIN[tree.status] || "#22c55e" }}
                        >
                          {tree.treeNumber}
                        </div>
                        <span className="text-xs text-gray-600 truncate">{tree.species || "Unknown"}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto flex-shrink-0", STATUS_COLORS[tree.status])}>
                          {tree.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/properties/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors mt-2"
              >
                <TreePine className="w-4 h-4" />
                Open Property Center
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
