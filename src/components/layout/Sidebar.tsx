"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  IdCard,
  QrCode,
  BarChart3,
  Shield,
  Settings,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users, permission: "usuarios.ver" },
  { href: "/carnets", label: "Carnés", icon: IdCard, permission: "carnets.ver" },
  { href: "/validar", label: "Validar QR", icon: QrCode, permission: "validar.qr" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, permission: "reportes.ver" },
  { href: "/auditoria", label: "Auditoría", icon: Shield, permission: "auditoria.ver" },
  { href: "/roles", label: "Roles", icon: UserCog, permission: "roles.gestionar" },
  { href: "/configuracion/regionales", label: "Configuración", icon: Settings, permission: "config.gestionar" },
];

export function Sidebar({ permisos }: { permisos: string[] }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.permission || permisos.includes(item.permission)
  );

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-[#0066CC]">SENA Carnés</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#0066CC] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
