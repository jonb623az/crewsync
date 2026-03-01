"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Briefcase,
  CalendarClock,
  AlertTriangle,
  Clock,
  MapPin,
  GripVertical,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnscheduledItem } from "@/types";

type Tab = "estimates" | "jobs";

interface Props {
  items: UnscheduledItem[];
  onDragStart: (item: UnscheduledItem) => void;
  onDragEnd: () => void;
  onQuickCreate: (type: "estimate" | "job") => void;
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-gray-300",
};

export default function UnscheduledQueue({
  items,
  onDragStart,
  onDragEnd,
  onQuickCreate,
}: Props) {
  const [tab, setTab] = useState<Tab>("jobs");
  const [search, setSearch] = useState("");

  const estimates = useMemo(
    () =>
      items
        .filter((i) => i.type === "estimate")
        .filter(
          (i) =>
            !search ||
            i.title.toLowerCase().includes(search.toLowerCase()) ||
            i.clientName?.toLowerCase().includes(search.toLowerCase()) ||
            i.address?.toLowerCase().includes(search.toLowerCase())
        ),
    [items, search]
  );

  const jobs = useMemo(
    () =>
      items
        .filter((i) => i.type === "job")
        .filter(
          (i) =>
            !search ||
            i.title.toLowerCase().includes(search.toLowerCase()) ||
            i.clientName?.toLowerCase().includes(search.toLowerCase()) ||
            i.address?.toLowerCase().includes(search.toLowerCase())
        ),
    [items, search]
  );

  const shown = tab === "estimates" ? estimates : jobs;

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Queue</h2>
          <button
            onClick={() => onQuickCreate(tab === "estimates" ? "estimate" : "job")}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg mb-2">
          <button
            onClick={() => setTab("estimates")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
              tab === "estimates"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <CalendarClock className="w-3 h-3" />
            Estimates
            {estimates.length > 0 && (
              <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 text-xs leading-4">
                {estimates.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("jobs")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
              tab === "jobs"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Briefcase className="w-3 h-3" />
            Jobs
            {jobs.length > 0 && (
              <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 text-xs leading-4">
                {jobs.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-green-400 transition-colors"
          />
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              {tab === "jobs" ? (
                <Briefcase className="w-5 h-5 text-gray-300" />
              ) : (
                <CalendarClock className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              No unscheduled {tab}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Drag items onto the calendar to schedule
            </p>
          </div>
        ) : (
          shown.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QueueCard({
  item,
  onDragStart,
  onDragEnd,
}: {
  item: UnscheduledItem;
  onDragStart: (item: UnscheduledItem) => void;
  onDragEnd: () => void;
}) {
  const isJob = item.type === "job";
  const isHighPriority = item.priority === "HIGH";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart(item);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-white rounded-lg border cursor-grab active:cursor-grabbing select-none",
        "hover:shadow-md transition-all duration-150 group",
        isJob ? "border-gray-200 hover:border-blue-300" : "border-gray-200 hover:border-purple-300",
        isHighPriority && "border-red-200 hover:border-red-400"
      )}
    >
      <div className="px-2.5 py-2">
        {/* Top row */}
        <div className="flex items-start gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0 group-hover:text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {/* Type badge */}
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                  isJob
                    ? "bg-blue-50 text-blue-600"
                    : "bg-purple-50 text-purple-600"
                )}
              >
                {isJob ? "JOB" : "EST"}
              </span>
              {/* Priority dot */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  PRIORITY_DOT[item.priority] || "bg-gray-300"
                )}
                title={`Priority: ${item.priority}`}
              />
              {isHighPriority && (
                <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
            </div>
            {/* Title */}
            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {item.title}
            </p>
          </div>
        </div>

        {/* Client + address */}
        <div className="mt-1 pl-5 space-y-0.5">
          {item.clientName && (
            <p className="text-xs text-gray-500 truncate font-medium">{item.clientName}</p>
          )}
          {item.address && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {item.address}{item.city ? `, ${item.city}` : ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{item.durationEst}m est.</span>
            {item.number && (
              <span className="ml-1 font-mono text-gray-300">{item.number}</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {item.tags && (
          <div className="mt-1.5 pl-5 flex flex-wrap gap-1">
            {item.tags.split(",").map((tag) => (
              <span
                key={tag.trim()}
                className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
