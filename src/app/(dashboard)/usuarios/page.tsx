"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TIPO_USUARIO_LABELS } from "@/lib/constants";
import { Plus, Search } from "lucide-react";

interface UsuarioRow {
  id: string;
  documento: string;
  nombreCompleto: string;
  email: string;
  tipoUsuario: string;
  estado: string;
  regional?: { nombre: string } | null;
  centro?: { nombre: string } | null;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function fetchUsuarios(q?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/usuarios?${params}`);
    const json = await res.json();
    if (json.success) setUsuarios(json.data.items);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        <ButtonLink href="/usuarios/nuevo" className="bg-[#0066CC]">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo usuario
        </ButtonLink>
      </div>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Buscar por nombre, documento o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" onClick={() => fetchUsuarios(search)}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Regional / Centro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No hay usuarios
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.documento}</TableCell>
                  <TableCell>{u.nombreCompleto}</TableCell>
                  <TableCell>{TIPO_USUARIO_LABELS[u.tipoUsuario] ?? u.tipoUsuario}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.regional?.nombre ?? "—"} / {u.centro?.nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.estado} type="usuario" />
                  </TableCell>
                  <TableCell>
                    <ButtonLink href={`/usuarios/${u.id}`} variant="ghost" size="sm">
                      Editar
                    </ButtonLink>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
