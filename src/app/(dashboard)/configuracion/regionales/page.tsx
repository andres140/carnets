"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Regional {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export default function RegionalesPage() {
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRegionales(j.data);
      });
  }, []);

  async function crearRegional() {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "regional",
        data: { codigo, nombre },
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Regional creada");
      setCodigo("");
      setNombre("");
      const j = await fetch("/api/config").then((r) => r.json());
      if (j.success) setRegionales(j.data);
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regionales</h1>
          <p className="text-muted-foreground">Configuración de regionales SENA</p>
        </div>
        <ButtonLink href="/configuracion/centros" variant="outline">
          Centros de formación
        </ButtonLink>
      </div>

      <Card>
        <CardHeader><CardTitle>Nueva regional</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="REG01" />
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="bg-[#0066CC]" onClick={crearRegional}>Crear</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Regionales registradas</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {regionales.map((r) => (
              <li key={r.id} className="flex justify-between border-b py-2 text-sm">
                <span><strong className="font-mono">{r.codigo}</strong> — {r.nombre}</span>
                <span className={r.activo ? "text-green-600" : "text-gray-400"}>
                  {r.activo ? "Activa" : "Inactiva"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
