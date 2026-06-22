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
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { TIPOS_USUARIO, TIPOS_DOCUMENTO } from "@/lib/constants";
import { toast } from "sonner";

interface Rol { id: string; nombre: string }
interface Regional { id: string; nombre: string; centros?: Array<{ id: string; nombre: string }> }

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regionalId, setRegionalId] = useState("");
  const [centroId, setCentroId] = useState("");
  const [rolId, setRolId] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("APRENDIZ");
  const [tipoDocumento, setTipoDocumento] = useState("CC");

  useEffect(() => {
    fetch("/api/roles").then((r) => r.json()).then((j) => {
      if (j.success) setRoles(j.data.roles);
    });
    fetch("/api/config").then((r) => r.json()).then((j) => {
      if (j.success) setRegionales(j.data);
    });
  }, []);

  const centros = regionales.find((r) => r.id === regionalId)?.centros ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body = {
      email: form.get("email"),
      password: form.get("password"),
      documento: form.get("documento"),
      nombreCompleto: form.get("nombreCompleto"),
      telefono: form.get("telefono") || null,
      rolId,
      tipoUsuario,
      tipoDocumento,
      regionalId: regionalId || null,
      centroId: centroId || null,
      fotoUrl,
    };

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);

    if (json.success) {
      toast.success("Usuario creado");
      router.push("/usuarios");
    } else {
      toast.error(json.error ?? "Error al crear usuario");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nuevo usuario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos del usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PhotoUpload value={fotoUrl} onChange={setFotoUrl} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input name="nombreCompleto" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo documento</Label>
                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v ?? "CC")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input name="documento" required />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input name="password" type="password" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input name="telefono" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de usuario</Label>
                <Select value={tipoUsuario} onValueChange={(v) => setTipoUsuario(v ?? "APRENDIZ")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_USUARIO.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={rolId} onValueChange={(v) => setRolId(v ?? "")} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Regional</Label>
                <Select value={regionalId} onValueChange={(v) => { setRegionalId(v ?? ""); setCentroId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {regionales.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Centro</Label>
                <Select value={centroId} onValueChange={(v) => setCentroId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {centros.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-[#0066CC]" disabled={loading || !rolId}>
                {loading ? "Guardando..." : "Crear usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
