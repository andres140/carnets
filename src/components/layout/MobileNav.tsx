"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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

export function MobileNav({ permisos }: { permisos: string[] }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(
    (item) => !item.permission || permisos.includes(item.permission)
  );

  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-[#0066CC]">SENA Carnés</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-[#0066CC] text-white" : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
