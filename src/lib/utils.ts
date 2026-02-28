import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function genNumber(prefix: string, count: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
}

export const STATUS_COLORS: Record<string, string> = {
  // Job
  UNSCHEDULED: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  INVOICED: "bg-teal-100 text-teal-700",
  CANCELLED: "bg-red-100 text-red-700",
  // Proposal
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  // Invoice
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-gray-100 text-gray-400",
  // Tree
  HEALTHY: "bg-green-100 text-green-700",
  MONITOR: "bg-yellow-100 text-yellow-700",
  WORK_NEEDED: "bg-orange-100 text-orange-700",
  HAZARD: "bg-red-100 text-red-700",
  REMOVED: "bg-gray-100 text-gray-500",
};

export const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export const TREE_STATUS_PIN: Record<string, string> = {
  HEALTHY: "#22c55e",
  MONITOR: "#eab308",
  WORK_NEEDED: "#f97316",
  HAZARD: "#ef4444",
  REMOVED: "#9ca3af",
};
