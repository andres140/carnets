"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { TIPOS_USUARIO, TIPOS_DOCUMENTO, ESTADOS_USUARIO } from "@/lib/constants";
import { toast } from "sonner";

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<Record<string, unknown> | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; nombre: string }>>([]);
  const [regionales, setRegionales] = useState<Array<{ id: string; nombre: string; centros?: Array<{ id: string; nombre: string }> }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/usuarios/${id}`).then((r) => r.json()).then((j) => {
      if (j.success) setUsuario(j.data);
    });
    fetch("/api/roles").then((r) => r.json()).then((j) => {
      if (j.success) setRoles(j.data.roles);
    });
    fetch("/api/config").then((r) => r.json()).then((j) => {
      if (j.success) setRegionales(j.data);
    });
  }, [id]);

  if (!usuario) return <p>Cargando...</p>;

  const regionalId = (usuario.regionalId as string) ?? "";
  const centros = regionales.find((r) => r.id === regionalId)?.centros ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body = {
      email: form.get("email"),
      documento: form.get("documento"),
      nombreCompleto: form.get("nombreCompleto"),
      telefono: form.get("telefono") || null,
      rolId: form.get("rolId"),
      tipoUsuario: form.get("tipoUsuario"),
      tipoDocumento: form.get("tipoDocumento"),
      estado: form.get("estado"),
      regionalId: form.get("regionalId") || null,
      centroId: form.get("centroId") || null,
      fotoUrl: usuario?.fotoUrl,
      password: form.get("password") || undefined,
    };

    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);

    if (json.success) {
      toast.success("Usuario actualizado");
      router.push("/usuarios");
    } else {
      toast.error(json.error ?? "Error");
    }
  }

  async function handleDeactivate() {
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Usuario desactivado");
      router.push("/usuarios");
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Editar usuario</h1>
      <Card>
        <CardHeader><CardTitle>Datos del usuario</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PhotoUpload
              value={usuario.fotoUrl as string | null}
              onChange={(url) => setUsuario({ ...usuario, fotoUrl: url })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input name="nombreCompleto" value={usuario.nombreCompleto as string} onChange={(e) => setUsuario({ ...usuario, nombreCompleto: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" value={usuario.email as string} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo documento</Label>
                <select name="tipoDocumento" className="flex h-9 w-full rounded-md border px-3" value={usuario.tipoDocumento as string} onChange={(e) => setUsuario({ ...usuario, tipoDocumento: e.target.value })}>
                  {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input name="documento" value={usuario.documento as string} onChange={(e) => setUsuario({ ...usuario, documento: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña (opcional)</Label>
                <Input name="password" type="password" minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select name="estado" className="flex h-9 w-full rounded-md border px-3" value={usuario.estado as string} onChange={(e) => setUsuario({ ...usuario, estado: e.target.value })}>
                  {ESTADOS_USUARIO.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tipo usuario</Label>
                <select name="tipoUsuario" className="flex h-9 w-full rounded-md border px-3" value={usuario.tipoUsuario as string} onChange={(e) => setUsuario({ ...usuario, tipoUsuario: e.target.value })}>
                  {TIPOS_USUARIO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <select name="rolId" className="flex h-9 w-full rounded-md border px-3" value={usuario.rolId as string} onChange={(e) => setUsuario({ ...usuario, rolId: e.target.value })}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Regional</Label>
                <select name="regionalId" className="flex h-9 w-full rounded-md border px-3" value={regionalId} onChange={(e) => setUsuario({ ...usuario, regionalId: e.target.value })}>
                  <option value="">—</option>
                  {regionales.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Centro</Label>
                <select name="centroId" className="flex h-9 w-full rounded-md border px-3" value={(usuario.centroId as string) ?? ""} onChange={(e) => setUsuario({ ...usuario, centroId: e.target.value })}>
                  <option value="">—</option>
                  {centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-[#0066CC]" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeactivate}>
                Desactivar
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
