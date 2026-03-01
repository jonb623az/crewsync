"use client";
import { useState, useEffect, useCallback } from "react";
import {
  endOfWeek,
  endOfMonth,
  startOfWeek,
  startOfMonth,
} from "date-fns";
import { X, Undo2, Loader2 } from "lucide-react";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { DispatchEvent, UnscheduledItem, CrewResource, SalesResource, UndoEntry } from "@/types";
import UnscheduledQueue from "./UnscheduledQueue";
import CalendarPanel from "./CalendarPanel";
import MapPanel from "./MapPanel";
import EventDetailDrawer from "./EventDetailDrawer";
import QuickCreateModal from "./QuickCreateModal";

interface Props {
  crews: CrewResource[];
  salesUsers: SalesResource[];
}

type ViewType = "day" | "week" | "month";
type LaneModeType = "crew" | "arborist";

function getDateRange(date: Date, view: ViewType): { start: Date; end: Date } {
  if (view === "day") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (view === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 0 }),
      end: endOfWeek(date, { weekStartsOn: 0 }),
    };
  }
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export default function DispatchPlanner({ crews, salesUsers }: Props) {
  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [unscheduled, setUnscheduled] = useState<UnscheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("day");
  const [laneMode, setLaneMode] = useState<LaneModeType>("crew");
  const [draggedItem, setDraggedItem] = useState<UnscheduledItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DispatchEvent | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [undoToasts, setUndoToasts] = useState<UndoEntry[]>([]);
  const [quickCreateType, setQuickCreateType] = useState<"estimate" | "job" | null>(null);

  // Fetch calendar events
  const loadEvents = useCallback(async (date: Date, v: ViewType) => {
    const { start, end } = getDateRange(date, v);
    const res = await fetch(
      `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
    );
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  // Fetch unscheduled queue
  const loadUnscheduled = useCallback(async () => {
    const res = await fetch("/api/unscheduled");
    if (res.ok) setUnscheduled(await res.json());
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEvents(currentDate, view);
  }, [currentDate, view, loadEvents]);

  useEffect(() => {
    loadUnscheduled();
  }, [loadUnscheduled]);

  // Optimistic event update
  const patchEvent = useCallback(
    async (
      id: string,
      type: "job" | "estimate",
      patch: Record<string, unknown>,
      prevEvent: DispatchEvent,
      toastMessage: string
    ) => {
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                ...patch,
                start: patch.start ? new Date(patch.start as string) : e.start,
                end: patch.end ? new Date(patch.end as string) : e.end,
              }
            : e
        )
      );

      // Undo entry
      const undoEntry: UndoEntry = {
        id: Date.now().toString(),
        message: toastMessage,
        restore: async () => {
          await fetch(`/api/calendar/event/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              start: prevEvent.start,
              end: prevEvent.end,
              crewId: prevEvent.crewId,
              assignedToId: prevEvent.assignedToId,
              status: prevEvent.status,
            }),
          });
          loadEvents(currentDate, view);
        },
      };

      setUndoToasts((t) => [undoEntry, ...t.slice(0, 2)]);
      setTimeout(() => {
        setUndoToasts((t) => t.filter((e) => e.id !== undoEntry.id));
      }, 8000);

      // Persist
      const res = await fetch(`/api/calendar/event/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...patch }),
      });

      if (!res.ok) {
        // Rollback
        setEvents((prev) => prev.map((e) => (e.id === id ? prevEvent : e)));
        setUndoToasts((t) => t.filter((e) => e.id !== undoEntry.id));
      }
    },
    [currentDate, view, loadEvents]
  );

  // Handle drag within calendar (move)
  const handleEventDrop = useCallback(
    (args: EventInteractionArgs<{ id: string; dispatchEvent: DispatchEvent }>) => {
      const { event, start, end, resourceId } = args as {
        event: { id: string; dispatchEvent: DispatchEvent };
        start: Date;
        end: Date;
        resourceId?: string;
      };
      const de = event.dispatchEvent;
      const type = de.type === "estimate" ? "estimate" : "job";

      patchEvent(
        de.id,
        type,
        {
          start: start.toISOString(),
          end: end.toISOString(),
          ...(resourceId && type === "job" ? { crewId: resourceId } : {}),
          ...(resourceId && type === "estimate" ? { assignedToId: resourceId } : {}),
        },
        de,
        `Moved "${de.title}" to ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} — Undo`
      );
    },
    [patchEvent]
  );

  // Handle resize
  const handleEventResize = useCallback(
    (args: EventInteractionArgs<{ id: string; dispatchEvent: DispatchEvent }>) => {
      const { event, start, end } = args as {
        event: { id: string; dispatchEvent: DispatchEvent };
        start: Date;
        end: Date;
      };
      const de = event.dispatchEvent;
      const type = de.type === "estimate" ? "estimate" : "job";

      patchEvent(
        de.id,
        type,
        { start: start.toISOString(), end: end.toISOString() },
        de,
        `Resized "${de.title}" — Undo`
      );
    },
    [patchEvent]
  );

  // Handle drop from queue onto calendar
  const handleDropFromOutside = useCallback(
    async (start: Date, end: Date, resourceId?: string) => {
      if (!draggedItem) return;

      const item = draggedItem;
      setDraggedItem(null);

      // Remove from queue optimistically
      setUnscheduled((prev) => prev.filter((i) => i.id !== item.id));

      const type = item.type === "estimate" ? "estimate" : "job";
      const patch: Record<string, unknown> = {
        type,
        start: start.toISOString(),
        end: end.toISOString(),
        status: "SCHEDULED",
      };

      if (resourceId && type === "job") patch.crewId = resourceId;
      if (resourceId && type === "estimate") patch.assignedToId = resourceId;

      const res = await fetch(`/api/calendar/event/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (res.ok) {
        // Add the new event to calendar
        const color = type === "job" ? (item.crewColor || "#6b7280") : "#8b5cf6";
        const newEvent: DispatchEvent = {
          id: item.id,
          type: item.type,
          title: item.title,
          start,
          end,
          resourceId: resourceId ?? null,
          status: "SCHEDULED",
          priority: item.priority,
          crewId: type === "job" ? (resourceId ?? item.crewId) : null,
          crewName: type === "job" ? crews.find((c) => c.id === resourceId)?.title ?? null : null,
          crewColor: color,
          assignedToId: type === "estimate" ? (resourceId ?? item.assignedToId) : null,
          assignedToName: type === "estimate"
            ? salesUsers.find((u) => u.id === resourceId)?.title ?? item.assignedToName
            : null,
          propertyId: item.propertyId,
          clientId: item.clientId,
          clientName: item.clientName,
          address: item.address,
          city: item.city,
          lat: item.lat,
          lng: item.lng,
          durationEst: item.durationEst,
          instructions: null,
          hazardNotes: null,
          equipmentNeeds: null,
          number: item.number,
          tags: item.tags,
          source: item.source,
        };
        setEvents((prev) => [...prev, newEvent]);
      } else {
        // Restore to queue
        setUnscheduled((prev) => [...prev, item]);
      }
    },
    [draggedItem, crews, salesUsers]
  );

  // Handle event update from drawer
  const handleEventUpdate = useCallback(
    async (id: string, type: "job" | "estimate", patch: Record<string, unknown>) => {
      const prev = events.find((e) => e.id === id);
      if (!prev) return;

      // Compute display updates
      const displayPatch: Partial<DispatchEvent> = { ...patch as Partial<DispatchEvent> };
      if (patch.crewId !== undefined && type === "job") {
        displayPatch.crewName = crews.find((c) => c.id === patch.crewId)?.title ?? null;
        displayPatch.crewColor = crews.find((c) => c.id === patch.crewId)?.color ?? "#6b7280";
        displayPatch.resourceId = patch.crewId as string;
      }
      if (patch.assignedToId !== undefined && type === "estimate") {
        displayPatch.assignedToName =
          salesUsers.find((u) => u.id === patch.assignedToId)?.title ?? null;
        displayPatch.resourceId = patch.assignedToId as string;
      }

      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...displayPatch } : e)));
      // Update selected event too
      setSelectedEvent((s) => (s?.id === id ? { ...s, ...displayPatch } : s));

      await fetch(`/api/calendar/event/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...patch }),
      });
    },
    [events, crews, salesUsers]
  );

  return (
    <div className="flex h-[calc(100vh-96px)] -mx-6 -mt-6 overflow-hidden relative">
      {/* LEFT: Unscheduled Queue (20%) */}
      <div className="w-[260px] flex-shrink-0 overflow-hidden flex flex-col">
        <UnscheduledQueue
          items={unscheduled}
          onDragStart={setDraggedItem}
          onDragEnd={() => setDraggedItem(null)}
          onQuickCreate={setQuickCreateType}
        />
      </div>

      {/* CENTER: Calendar (flex-1) */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        )}
        <CalendarPanel
          events={events}
          crews={crews}
          salesUsers={salesUsers}
          currentDate={currentDate}
          view={view}
          laneMode={laneMode}
          draggedQueueItem={draggedItem}
          hoveredEventId={hoveredEventId}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onLaneModeChange={setLaneMode}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDropFromOutside={handleDropFromOutside}
          onEventClick={setSelectedEvent}
          onEventHover={setHoveredEventId}
        />
      </div>

      {/* RIGHT: Map (280px) */}
      <div className="w-[280px] flex-shrink-0 overflow-hidden flex flex-col">
        <MapPanel
          events={events}
          hoveredEventId={hoveredEventId}
          onPinClick={setSelectedEvent}
          onPinHover={setHoveredEventId}
        />
      </div>

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          crews={crews}
          salesUsers={salesUsers}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleEventUpdate}
        />
      )}

      {/* Quick Create Modal */}
      {quickCreateType && (
        <QuickCreateModal
          type={quickCreateType}
          crews={crews}
          salesUsers={salesUsers}
          onClose={() => setQuickCreateType(null)}
          onCreated={() => {
            loadUnscheduled();
            loadEvents(currentDate, view);
          }}
        />
      )}

      {/* Undo Toasts */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {undoToasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-gray-900 text-white text-sm rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto"
          >
            <span>{toast.message}</span>
            <button
              onClick={async () => {
                await toast.restore();
                setUndoToasts((t) => t.filter((e) => e.id !== toast.id));
              }}
              className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={() => setUndoToasts((t) => t.filter((e) => e.id !== toast.id))}
              className="text-gray-400 hover:text-white ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
