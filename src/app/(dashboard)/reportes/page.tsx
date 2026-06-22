"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import type { ReporteResumen } from "@/types/api";

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ReporteResumen | null>(null);

  useEffect(() => {
    fetch("/api/reportes")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setResumen(j.data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Estadísticas y exportación de datos</p>
        </div>
        <a href="/api/reportes?format=csv" className={buttonVariants({ variant: "outline" })}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </a>
      </div>

      {resumen && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Por estado</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {Object.entries(resumen.carnetsPorEstado).map(([k, v]) => (
                  <li key={k} className="flex justify-between text-sm">
                    <span>{k}</span><span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Por tipo de usuario</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {Object.entries(resumen.carnetsPorTipo).map(([k, v]) => (
                  <li key={k} className="flex justify-between text-sm">
                    <span>{k}</span><span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Por centro</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {resumen.carnetsPorCentro.map((c) => (
                  <li key={c.centro} className="flex justify-between text-sm">
                    <span className="truncate">{c.centro}</span>
                    <span className="font-medium">{c.total}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resumen general</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total usuarios: <strong>{resumen.totalUsuarios}</strong></p>
              <p>Total carnés: <strong>{resumen.totalCarnets}</strong></p>
              <p>Próximos a vencer (30 días): <strong>{resumen.proximosVencimientos}</strong></p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
