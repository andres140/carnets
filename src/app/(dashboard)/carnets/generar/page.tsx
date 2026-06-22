"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarnetPreview } from "@/components/carnets/CarnetPreview";
import { toast } from "sonner";

interface UsuarioOption {
  id: string;
  nombreCompleto: string;
  documento: string;
  tipoUsuario: string;
  fotoUrl: string | null;
  centro?: { nombre: string } | null;
  regional?: { nombre: string } | null;
}

export default function GenerarCarnetPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/usuarios?pageSize=500")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setUsuarios(j.data.items);
      });
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFechaVencimiento(nextYear.toISOString().split("T")[0]);
  }, []);

  const selected = usuarios.find((u) => u.id === usuarioId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioId || !fechaVencimiento) return;
    setLoading(true);

    const res = await fetch("/api/carnets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId, fechaVencimiento }),
    });
    const json = await res.json();
    setLoading(false);

    if (json.success) {
      toast.success("Carné generado");
      router.push(`/carnets/${json.data.id}`);
    } else {
      toast.error(json.error ?? "Error al generar carné");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Generar carné individual</h1>

      <Card>
        <CardHeader><CardTitle>Seleccionar usuario</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select value={usuarioId} onValueChange={(v) => setUsuarioId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombreCompleto} — {u.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} required />
            </div>
            <Button type="submit" className="bg-[#0066CC]" disabled={loading || !usuarioId}>
              {loading ? "Generando..." : "Generar carné"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {selected && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Vista previa</h2>
          <CarnetPreview
            nombreCompleto={selected.nombreCompleto}
            documento={selected.documento}
            tipoUsuario={selected.tipoUsuario}
            centroNombre={selected.centro?.nombre}
            regionalNombre={selected.regional?.nombre}
            fotoUrl={selected.fotoUrl}
            fechaVencimiento={fechaVencimiento}
          />
        </div>
      )}
    </div>
  );
}
