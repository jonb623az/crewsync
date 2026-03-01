"use client";
import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DispatchEvent } from "@/types";

interface Props {
  events: DispatchEvent[];
  hoveredEventId: string | null;
  onPinClick: (event: DispatchEvent) => void;
  onPinHover: (id: string | null) => void;
}

export default function MapPanel({ events, hoveredEventId, onPinClick, onPinHover }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-render markers when events change
  const renderMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.loaded()) return;

    // Remove all old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const eventsWithGeo = events.filter((e) => e.lat && e.lng);
    if (eventsWithGeo.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    eventsWithGeo.forEach((event) => {
      const isJob = event.type === "job";
      const color = isJob ? (event.crewColor || "#6b7280") : "#8b5cf6";
      const isHovered = event.id === hoveredEventId;

      const el = document.createElement("div");
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid ${isHovered ? "white" : color + "88"};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        cursor: pointer;
        box-shadow: ${isHovered ? `0 0 0 3px ${color}55, 0 4px 12px rgba(0,0,0,0.3)` : "0 2px 6px rgba(0,0,0,0.2)"};
        transition: all 0.2s;
        transform: ${isHovered ? "scale(1.3)" : "scale(1)"};
      `;
      el.textContent = isJob ? "🔨" : "📅";
      el.title = `${event.title}\n${event.address || ""}`;

      el.addEventListener("click", () => onPinClick(event));
      el.addEventListener("mouseenter", () => onPinHover(event.id));
      el.addEventListener("mouseleave", () => onPinHover(null));

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.lng!, event.lat!])
        .addTo(map);

      markersRef.current[event.id] = marker;
      bounds.extend([event.lng!, event.lat!]);
    });

    if (eventsWithGeo.length === 1) {
      map.flyTo({ center: [eventsWithGeo[0].lng!, eventsWithGeo[0].lat!], zoom: 14 });
    } else if (eventsWithGeo.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [events, hoveredEventId, onPinClick, onPinHover]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (map.loaded()) {
      renderMarkers();
    } else {
      map.on("load", renderMarkers);
      return () => { map.off("load", renderMarkers); };
    }
  }, [renderMarkers]);

  // Pulse hovered marker
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const event = events.find((e) => e.id === id);
      if (!event) return;
      const color = event.type === "job" ? (event.crewColor || "#6b7280") : "#8b5cf6";
      const isHovered = id === hoveredEventId;

      el.style.border = `3px solid ${isHovered ? "white" : color + "88"}`;
      el.style.boxShadow = isHovered
        ? `0 0 0 3px ${color}55, 0 4px 12px rgba(0,0,0,0.3)`
        : "0 2px 6px rgba(0,0,0,0.2)";
      el.style.transform = isHovered ? "scale(1.3)" : "scale(1)";
      el.style.zIndex = isHovered ? "10" : "1";
    });
  }, [hoveredEventId, events]);

  const eventsWithGeo = events.filter((e) => e.lat && e.lng);

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Logistics Map</h2>
          <span className="text-xs text-gray-400">{eventsWithGeo.length} pins</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Empty state overlay */}
        {events.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-90 z-10">
            <div className="text-center px-4">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-xs font-medium text-gray-500">
                No events in this view
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Schedule jobs to see them on the map
              </p>
            </div>
          </div>
        )}

        {eventsWithGeo.length === 0 && events.length > 0 && (
          <div className="absolute bottom-4 left-2 right-2 bg-white bg-opacity-90 rounded-lg p-2 text-center z-10">
            <p className="text-xs text-gray-500">No geocoded locations for current events</p>
          </div>
        )}
      </div>

      {/* Event list */}
      {eventsWithGeo.length > 0 && (
        <div className="border-t border-gray-100 max-h-40 overflow-y-auto flex-shrink-0 bg-white">
          {eventsWithGeo.map((event) => {
            const color = event.type === "job" ? (event.crewColor || "#6b7280") : "#8b5cf6";
            return (
              <button
                key={event.id}
                onClick={() => onPinClick(event)}
                onMouseEnter={() => onPinHover(event.id)}
                onMouseLeave={() => onPinHover(null)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  hoveredEventId === event.id ? "bg-blue-50" : ""
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{event.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {event.address}{event.city ? `, ${event.city}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
