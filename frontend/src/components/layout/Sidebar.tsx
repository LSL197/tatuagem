"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  UserCheck,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: Calendar,
    roles: ["admin", "artist", "receptionist"],
  },
  {
    label: "Tatuadores",
    href: "/tatuadores",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    label: "Leads / CRM",
    href: "/leads",
    icon: UserCheck,
    roles: ["admin"],
  },
  {
    label: "Automações",
    href: "/automacoes",
    icon: Zap,
    roles: ["admin"],
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const role = user?.role ?? "client";
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-white font-bold text-lg">Estúdio</h2>
        <p className="text-gray-400 text-sm">{user?.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
