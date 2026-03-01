"use client";
import { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  Users,
  User,
  AlertTriangle,
  Wrench,
  FileText,
  ExternalLink,
  CheckCircle,
  Truck,
  Play,
  ChevronDown,
} from "lucide-react";
import { cn, STATUS_COLORS, formatDate } from "@/lib/utils";
import { DispatchEvent, CrewResource, SalesResource } from "@/types";
import { format } from "date-fns";

interface Props {
  event: DispatchEvent;
  crews: CrewResource[];
  salesUsers: SalesResource[];
  onClose: () => void;
  onUpdate: (id: string, type: "job" | "estimate", patch: Record<string, unknown>) => Promise<void>;
}

const JOB_STATUS_FLOW = [
  { value: "SCHEDULED", label: "Scheduled", icon: Clock },
  { value: "DISPATCHED", label: "Dispatched", icon: Truck },
  { value: "IN_PROGRESS", label: "In Progress", icon: Play },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle },
];

const ESTIMATE_STATUS_FLOW = [
  { value: "SCHEDULED", label: "Scheduled", icon: Clock },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle },
  { value: "NO_SHOW", label: "No Show", icon: X },
];

export default function EventDetailDrawer({
  event,
  crews,
  salesUsers,
  onClose,
  onUpdate,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const isJob = event.type === "job";
  const color = isJob ? (event.crewColor || "#6b7280") : "#8b5cf6";
  const statusFlow = isJob ? JOB_STATUS_FLOW : ESTIMATE_STATUS_FLOW;

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    await onUpdate(event.id, event.type as "job" | "estimate", { status });
    setSaving(false);
  };

  const handleReassign = async (resourceId: string) => {
    setSaving(true);
    if (isJob) {
      await onUpdate(event.id, "job", { crewId: resourceId });
    } else {
      await onUpdate(event.id, "estimate", { assignedToId: resourceId });
    }
    setSaving(false);
    setShowReassign(false);
  };

  const startFormatted = event.start
    ? format(new Date(event.start), "EEE, MMM d · h:mm a")
    : "—";
  const endFormatted = event.end ? format(new Date(event.end), "h:mm a") : "—";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[360px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-gray-100 flex-shrink-0"
          style={{ borderTop: `4px solid ${color}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: color + "22", color }}
                >
                  {isJob ? "JOB" : "ESTIMATE"}
                </span>
                {event.number && (
                  <span className="text-xs font-mono text-gray-400">{event.number}</span>
                )}
                {event.priority === "HIGH" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status workflow */}
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {statusFlow.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors",
                    event.status === value
                      ? "border-transparent text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                  style={
                    event.status === value
                      ? { background: color, borderColor: color }
                      : {}
                  }
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Time</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {startFormatted} – {endFormatted}
              </span>
            </div>
            {event.durationEst && (
              <p className="text-xs text-gray-400 mt-1 ml-6">{event.durationEst}m estimated</p>
            )}
          </div>

          {/* Client + Property */}
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Location
            </p>
            {event.clientName && (
              <p className="text-sm font-medium text-gray-800 mb-0.5">{event.clientName}</p>
            )}
            {event.address && (
              <div className="flex items-start gap-1.5 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>
                  {event.address}
                  {event.city ? `, ${event.city}` : ""}
                </span>
              </div>
            )}
            {event.propertyId && (
              <a
                href={`/properties/${event.propertyId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Open Property Center
              </a>
            )}
          </div>

          {/* Assignment */}
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isJob ? "Crew" : "Arborist"}
              </p>
              <button
                onClick={() => setShowReassign(!showReassign)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Reassign <ChevronDown className={cn("w-3 h-3 transition-transform", showReassign && "rotate-180")} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {isJob ? (
                <Users className="w-4 h-4 text-gray-400" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-700">
                {isJob
                  ? event.crewName || "Unassigned"
                  : event.assignedToName || "Unassigned"}
              </span>
            </div>

            {showReassign && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => handleReassign("")}
                >
                  — Unassigned
                </div>
                {(isJob ? crews : salesUsers).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleReassign(r.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-2",
                      (isJob ? event.crewId : event.assignedToId) === r.id && "bg-blue-50 text-blue-700"
                    )}
                  >
                    {"color" in r && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: (r as CrewResource).color }}
                      />
                    )}
                    {r.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions / Notes */}
          {event.instructions && (
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Instructions
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.instructions}</p>
            </div>
          )}

          {/* Hazards */}
          {event.hazardNotes && (
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Hazards
              </p>
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                {event.hazardNotes}
              </p>
            </div>
          )}

          {/* Equipment */}
          {event.equipmentNeeds && (
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                Equipment Needs
              </p>
              <p className="text-sm text-gray-700">{event.equipmentNeeds}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.split(",").map((tag) => (
                  <span
                    key={tag.trim()}
                    className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Click backdrop to close · Changes saved instantly
          </p>
        </div>
      </div>
    </>
  );
}
