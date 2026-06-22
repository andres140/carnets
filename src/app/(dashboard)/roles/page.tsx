"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Rol {
  id: string;
  nombre: string;
  permisos: Array<{ permiso: { id: string; codigo: string; nombre: string } }>;
}

interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [selectedRol, setSelectedRol] = useState<string>("");
  const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setRoles(j.data.roles);
          setPermisos(j.data.permisos);
        }
      });
  }, []);

  function selectRol(rolId: string) {
    setSelectedRol(rolId);
    const rol = roles.find((r) => r.id === rolId);
    if (rol) {
      setSelectedPermisos(new Set(rol.permisos.map((p) => p.permiso.id)));
    }
  }

  function togglePermiso(id: string) {
    const next = new Set(selectedPermisos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPermisos(next);
  }

  async function save() {
    const res = await fetch("/api/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rolId: selectedRol,
        permisoIds: Array.from(selectedPermisos),
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Permisos actualizados");
      const j = await fetch("/api/roles").then((r) => r.json());
      if (j.success) setRoles(j.data.roles);
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Roles y permisos</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {roles.map((rol) => (
              <Button
                key={rol.id}
                variant={selectedRol === rol.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => selectRol(rol.id)}
              >
                {rol.nombre}
              </Button>
            ))}
          </CardContent>
        </Card>

        {selectedRol && (
          <Card>
            <CardHeader><CardTitle>Permisos del rol</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {permisos.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermisos.has(p.id)}
                    onChange={() => togglePermiso(p.id)}
                  />
                  <span className="font-mono text-xs">{p.codigo}</span>
                  <span className="text-muted-foreground">{p.nombre}</span>
                </label>
              ))}
              <Button className="mt-4 bg-[#0066CC]" onClick={save}>Guardar permisos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
