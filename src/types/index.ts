export type Role =
  | "OWNER"
  | "OFFICE_MANAGER"
  | "SALES_ARBORIST"
  | "CREW_LEADER"
  | "CREW_MEMBER";

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
