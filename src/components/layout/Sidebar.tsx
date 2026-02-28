"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Map,
  FileText,
  Briefcase,
  HardHat,
  Receipt,
  BarChart3,
  Settings,
  TreePine,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/clients",    label: "Clients",      icon: Users },
  { href: "/properties", label: "Properties",   icon: MapPin },
  { href: "/map",        label: "Map",          icon: Map },
  { href: "/proposals",  label: "Proposals",    icon: FileText },
  { href: "/jobs",       label: "Jobs",         icon: Briefcase },
  { href: "/crews",      label: "Crews",        icon: HardHat },
  { href: "/invoices",   label: "Invoices",     icon: Receipt },
  { href: "/reports",    label: "Reports",      icon: BarChart3 },
  { href: "/settings",   label: "Settings",     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-gray-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <TreePine className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">
          CrewSync
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-green-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
