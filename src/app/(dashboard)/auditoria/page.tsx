"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditRow {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  createdAt: string;
  usuario?: { nombreCompleto: string; email: string } | null;
}

export default function AuditoriaPage() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auditoria")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setItems(j.data.items);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground">Historial de acciones del sistema</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Sin registros</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">
                    {new Date(item.createdAt).toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell>{item.usuario?.nombreCompleto ?? "Sistema"}</TableCell>
                  <TableCell>{item.accion}</TableCell>
                  <TableCell>{item.entidad}</TableCell>
                  <TableCell className="font-mono text-xs">{item.entidadId ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
