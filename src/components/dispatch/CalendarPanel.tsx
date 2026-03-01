"use client";
import { useMemo, useCallback, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Users,
  User,
  LayoutGrid,
  Rows3,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DispatchEvent, UnscheduledItem, CrewResource, SalesResource } from "@/types";

// react-big-calendar CSS — imported here for client component
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop(Calendar as any);

type ViewType = "day" | "week" | "month";
type LaneModeType = "crew" | "arborist";

interface Props {
  events: DispatchEvent[];
  crews: CrewResource[];
  salesUsers: SalesResource[];
  currentDate: Date;
  view: ViewType;
  laneMode: LaneModeType;
  draggedQueueItem: UnscheduledItem | null;
  hoveredEventId: string | null;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onLaneModeChange: (mode: LaneModeType) => void;
  onEventDrop: (args: EventInteractionArgs<{ id: string; dispatchEvent: DispatchEvent }>) => void;
  onEventResize: (args: EventInteractionArgs<{ id: string; dispatchEvent: DispatchEvent }>) => void;
  onDropFromOutside: (start: Date, end: Date, resourceId?: string) => void;
  onEventClick: (event: DispatchEvent) => void;
  onEventHover: (id: string | null) => void;
}

const STATUS_BORDER: Record<string, string> = {
  SCHEDULED: "border-l-blue-500",
  DISPATCHED: "border-l-purple-500",
  IN_PROGRESS: "border-l-yellow-500",
  COMPLETED: "border-l-green-500",
  UNSCHEDULED: "border-l-gray-400",
};

export default function CalendarPanel({
  events,
  crews,
  salesUsers,
  currentDate,
  view,
  laneMode,
  draggedQueueItem,
  hoveredEventId,
  onDateChange,
  onViewChange,
  onLaneModeChange,
  onEventDrop,
  onEventResize,
  onDropFromOutside,
  onEventClick,
  onEventHover,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Map events to react-big-calendar format
  const calEvents = useMemo(
    () =>
      events
        .filter((e) => e.start && e.end)
        .map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start!),
          end: new Date(e.end!),
          resource: e.resourceId ?? "__none__",
          dispatchEvent: e,
        })),
    [events]
  );

  // Resources for Day view lanes
  const resources = useMemo(() => {
    if (view !== "day") return undefined;
    if (laneMode === "crew") {
      return crews.map((c) => ({ resourceId: c.id, resourceTitle: c.title }));
    }
    return salesUsers.map((u) => ({ resourceId: u.id, resourceTitle: u.title }));
  }, [view, laneMode, crews, salesUsers]);

  // Navigate
  const navigate = useCallback(
    (direction: "prev" | "next" | "today") => {
      if (direction === "today") return onDateChange(new Date());
      if (view === "day") {
        onDateChange(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
      } else if (view === "week") {
        onDateChange(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
      } else {
        onDateChange(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
      }
    },
    [view, currentDate, onDateChange]
  );

  const dateLabel = useMemo(() => {
    if (view === "day") return format(currentDate, "EEEE, MMMM d, yyyy");
    if (view === "week") {
      const start = startOfWeek(currentDate, { locale: enUS });
      const end = addDays(start, 6);
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [view, currentDate]);

  // Event style getter
  const eventPropGetter = useCallback(
    (event: { id: string; resource: string; dispatchEvent: DispatchEvent }) => {
      const de = event.dispatchEvent;
      const color = de.type === "estimate" ? "#8b5cf6" : de.crewColor || "#6b7280";
      const isHovered = event.id === hoveredEventId;

      return {
        style: {
          backgroundColor: color + "22",
          borderLeft: `3px solid ${color}`,
          borderTop: "none",
          borderRight: "none",
          borderBottom: "none",
          borderRadius: "4px",
          color: "#111827",
          fontSize: "11px",
          padding: "2px 4px",
          outline: isHovered ? `2px solid ${color}` : "none",
          outlineOffset: "1px",
          cursor: "pointer",
          boxShadow: isHovered ? `0 0 0 2px ${color}44` : "none",
        },
      };
    },
    [hoveredEventId]
  );

  // Custom event component
  const EventComponent = useCallback(
    ({ event }: { event: { id: string; title: string; dispatchEvent: DispatchEvent } }) => {
      const de = event.dispatchEvent;
      const color = de.type === "estimate" ? "#8b5cf6" : de.crewColor || "#6b7280";
      return (
        <div
          onMouseEnter={() => onEventHover(event.id)}
          onMouseLeave={() => onEventHover(null)}
          className="h-full overflow-hidden"
        >
          <div className="font-semibold truncate leading-tight" style={{ fontSize: "11px" }}>
            {de.type === "estimate" ? "📅 " : "🔨 "}
            {event.title}
          </div>
          {de.clientName && (
            <div className="text-gray-500 truncate" style={{ fontSize: "10px" }}>
              {de.clientName}
            </div>
          )}
          {de.crewName && de.type === "job" && (
            <div
              className="truncate font-medium"
              style={{ fontSize: "10px", color }}
            >
              {de.crewName}
            </div>
          )}
          {de.assignedToName && de.type === "estimate" && (
            <div className="truncate" style={{ fontSize: "10px", color: "#8b5cf6" }}>
              {de.assignedToName}
            </div>
          )}
        </div>
      );
    },
    [onEventHover]
  );

  // Handle drop from queue (HTML5 drag)
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (draggedQueueItem) {
        e.preventDefault();
        setIsDragOver(true);
      }
    },
    [draggedQueueItem]
  );

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  // Drop on time slot
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      if (!draggedQueueItem) return;
      const end = new Date(
        slotInfo.start.getTime() + (draggedQueueItem.durationEst || 60) * 60000
      );
      onDropFromOutside(slotInfo.start, end, slotInfo.resourceId as string | undefined);
    },
    [draggedQueueItem, onDropFromOutside]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white",
        isDragOver && "ring-2 ring-inset ring-green-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={() => setIsDragOver(false)}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        {/* Nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("prev")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("today")}
            className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate("next")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <CalIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-gray-800 truncate">{dateLabel}</h2>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Lane mode toggle — only relevant in Day view */}
          {view === "day" && (
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => onLaneModeChange("crew")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors",
                  laneMode === "crew"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Users className="w-3 h-3" />
                By Crew
              </button>
              <button
                onClick={() => onLaneModeChange("arborist")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors",
                  laneMode === "arborist"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <User className="w-3 h-3" />
                By Arborist
              </button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {(
              [
                { v: "day", icon: Columns3, label: "Day" },
                { v: "week", icon: Rows3, label: "Week" },
                { v: "month", icon: LayoutGrid, label: "Month" },
              ] as const
            ).map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors",
                  view === v
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crew color legend */}
      {crews.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium flex-shrink-0">Crews:</span>
          {crews.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-xs text-gray-600">{c.title}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-xs text-gray-600">Estimates</span>
          </div>
        </div>
      )}

      {/* Drag hint */}
      {draggedQueueItem && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-1.5 text-xs text-green-700 font-medium text-center flex-shrink-0">
          Drop onto a time slot to schedule "{draggedQueueItem.title}"
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 overflow-hidden dispatch-calendar">
        <DnDCalendar
          localizer={localizer}
          events={calEvents}
          date={currentDate}
          view={view as (typeof Views)[keyof typeof Views]}
          views={[Views.DAY, Views.WEEK, Views.MONTH]}
          onNavigate={onDateChange}
          onView={(v) => onViewChange(v as ViewType)}
          resources={resources}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="resourceTitle"
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          min={new Date(0, 0, 0, 6, 0)}
          max={new Date(0, 0, 0, 19, 0)}
          step={15}
          timeslots={2}
          selectable={!!draggedQueueItem}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => onEventClick((event as { dispatchEvent: DispatchEvent }).dispatchEvent)}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          draggableAccessor={() => true}
          resizable
          eventPropGetter={eventPropGetter as Parameters<typeof DnDCalendar>[0]["eventPropGetter"]}
          components={{ event: EventComponent as Parameters<typeof DnDCalendar>[0]["components"]["event"] }}
          popup
          toolbar={false}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
