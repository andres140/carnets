"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
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
import { toast } from "sonner";

interface Centro {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  regional?: { nombre: string };
}

interface Regional {
  id: string;
  nombre: string;
}

export default function CentrosPage() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [regionalId, setRegionalId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    fetch("/api/config?tipo=centros")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCentros(j.data);
      });
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRegionales(j.data);
      });
  }, []);

  async function crearCentro() {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "centro",
        data: { regionalId, codigo, nombre },
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Centro creado");
      setCodigo("");
      setNombre("");
      const j = await fetch("/api/config?tipo=centros").then((r) => r.json());
      if (j.success) setCentros(j.data);
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centros de formación</h1>
          <p className="text-muted-foreground">Configuración de centros por regional</p>
        </div>
        <ButtonLink href="/configuracion/regionales" variant="outline">
          Regionales
        </ButtonLink>
      </div>

      <Card>
        <CardHeader><CardTitle>Nuevo centro</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Regional</Label>
            <Select value={regionalId} onValueChange={(v) => setRegionalId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {regionales.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CTR001" />
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="bg-[#0066CC]" onClick={crearCentro} disabled={!regionalId}>
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Centros registrados</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {centros.map((c) => (
              <li key={c.id} className="flex justify-between border-b py-2 text-sm">
                <span>
                  <strong className="font-mono">{c.codigo}</strong> — {c.nombre}
                  <span className="text-muted-foreground ml-2">({c.regional?.nombre})</span>
                </span>
                <span className={c.activo ? "text-green-600" : "text-gray-400"}>
                  {c.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
