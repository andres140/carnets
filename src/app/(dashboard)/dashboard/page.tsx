import { auth } from "@/lib/auth";
import { reporteService } from "@/services/reporte.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IdCard, AlertTriangle, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const resumen = await reporteService.getResumen(
    session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? "",
          nombreCompleto: session.user.nombreCompleto,
          tipoUsuario: session.user.tipoUsuario as import("@/generated/prisma/client").TipoUsuario,
          rolId: session.user.rolId,
          rolNombre: session.user.rolNombre,
          regionalId: session.user.regionalId,
          centroId: session.user.centroId,
          permisos: session.user.permisos,
        }
      : undefined
  );

  const activos = resumen.carnetsPorEstado.ACTIVO ?? 0;
  const vencidos = resumen.carnetsPorEstado.VENCIDO ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen del sistema de carnés institucionales
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.totalUsuarios}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carnés totales</CardTitle>
            <IdCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.totalCarnets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carnés activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {resumen.proximosVencimientos}
            </div>
            <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carnés por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(resumen.carnetsPorEstado).map(([estado, total]) => (
                <li key={estado} className="flex justify-between text-sm">
                  <span>{estado}</span>
                  <span className="font-medium">{total}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carnés por centro (top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resumen.carnetsPorCentro.map((item) => (
                <li key={item.centro} className="flex justify-between text-sm">
                  <span className="truncate">{item.centro}</span>
                  <span className="font-medium">{item.total}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
