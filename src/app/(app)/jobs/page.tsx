"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin, Clock, ChevronRight, X, CheckSquare, Square, Loader2 } from "lucide-react";
import { cn, formatDate, STATUS_COLORS } from "@/lib/utils";

type Task = { id: string; description: string; completed: boolean; tree: { treeNumber: number } | null };
type Job = {
  id: string; number: string; status: string; title: string | null;
  scheduledDate: string | null; durationEst: number | null;
  instructions: string | null; clientNotes: string | null;
  assignedTo: { name: string } | null;
  property: { id: string; address: string; city: string; state: string; name: string | null;
    client: { firstName: string; lastName: string } };
  tasks?: Task[];
};

const STATUSES = ["All", "UNSCHEDULED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Job | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs");
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (job: Job) => {
    const res = await fetch(`/api/jobs/${job.id}`);
    if (res.ok) setSelected(await res.json());
  };

  const toggleTask = async (jobId: string, taskId: string, completed: boolean) => {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskUpdate: { id: taskId, completed } }),
    });
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setSelected(await res.json());
  };

  const updateStatus = async (jobId: string, status: string) => {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setSelected(await res.json());
  };

  const filtered = filter === "All" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* List */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500">{filtered.length} jobs</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                filter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Briefcase className="w-8 h-8 mb-2 text-gray-200" />
                <p className="text-sm">No jobs found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(job => (
                  <div key={job.id} onClick={() => loadDetail(job)}
                    className={cn("flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors group",
                      selected?.id === job.id && "bg-green-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-gray-400">{job.number}</span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[job.status])}>
                          {job.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate">{job.title || job.property.address}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {job.property.address}, {job.property.city}
                        </span>
                        {job.scheduledDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {formatDate(job.scheduledDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {job.assignedTo && <p className="text-xs text-gray-400">{job.assignedTo.name}</p>}
                      {job.durationEst && <p className="text-xs text-gray-300">{job.durationEst}m est.</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs font-mono text-gray-400">{selected.number}</p>
              <p className="font-semibold text-gray-900">{selected.title || selected.property?.address}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(["UNSCHEDULED","SCHEDULED","IN_PROGRESS","COMPLETED"] as const).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                      selected.status === s ? STATUS_COLORS[s] + " border-transparent" : "border-gray-200 text-gray-400 hover:border-gray-300")}>
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Property + Client */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Property</p>
              <button onClick={() => router.push(`/properties/${selected.property?.id}`)} className="text-sm text-green-600 hover:underline">
                {selected.property?.address}, {selected.property?.city}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">
                {selected.property?.client?.firstName} {selected.property?.client?.lastName}
              </p>
            </div>

            {/* Instructions */}
            {selected.instructions && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Instructions</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.instructions}</p>
              </div>
            )}

            {/* Tasks */}
            {selected.tasks && selected.tasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tasks</p>
                <div className="space-y-2">
                  {selected.tasks.map(task => (
                    <button key={task.id} onClick={() => toggleTask(selected.id, task.id, !task.completed)}
                      className="flex items-start gap-2.5 w-full text-left hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
                      {task.completed
                        ? <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        : <Square className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                      <span className={cn("text-sm", task.completed && "line-through text-gray-400")}>
                        {task.tree && <span className="text-xs font-bold text-green-600 mr-1">T{task.tree.treeNumber}</span>}
                        {task.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
