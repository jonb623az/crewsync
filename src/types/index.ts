export type Role =
  | "OWNER"
  | "OFFICE_MANAGER"
  | "SALES_ARBORIST"
  | "CREW_LEADER"
  | "CREW_MEMBER";

// ─── Dispatch Planner Types ──────────────────────────────────────────────────

export type CalendarEventType = "job" | "estimate";

export type DispatchEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  start: Date | string | null;
  end: Date | string | null;
  resourceId: string | null;
  status: string;
  priority: string;
  crewId: string | null;
  crewName: string | null;
  crewColor: string;
  assignedToId: string | null;
  assignedToName: string | null;
  propertyId: string | null;
  clientId: string | null;
  clientName: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  durationEst: number | null;
  instructions: string | null;
  hazardNotes: string | null;
  equipmentNeeds: string | null;
  number: string | null;
  tags?: string | null;
  source?: string | null;
};

export type UnscheduledItem = {
  id: string;
  type: CalendarEventType;
  title: string;
  clientName: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  durationEst: number;
  status: string;
  priority: string;
  tags: string | null;
  source: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  propertyId: string | null;
  clientId: string | null;
  number: string | null;
  crewId: string | null;
  crewColor: string;
};

export type CrewResource = {
  id: string;
  title: string;
  color: string;
};

export type SalesResource = {
  id: string;
  title: string;
};

export type UndoEntry = {
  id: string;
  message: string;
  restore: () => Promise<void>;
};

export type TreeStatus =
  | "HEALTHY"
  | "MONITOR"
  | "WORK_NEEDED"
  | "HAZARD"
  | "REMOVED";

export type RiskRating = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ProposalStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type JobStatus =
  | "UNSCHEDULED"
  | "SCHEDULED"
  | "DISPATCHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "INVOICED"
  | "CANCELLED";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "VOID";

// ─── Augment NextAuth session ─────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      companyId: string;
      companyName: string;
    };
  }
}
