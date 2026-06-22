"use client";

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Plus, Search, FileDown } from "lucide-react";

interface CarnetRow {
  id: string;
  codigoUnico: string;
  nombreCompleto: string;
  documento: string;
  estado: string;
  fechaVencimiento: string;
  centroNombre: string | null;
}

export default function CarnetsPage() {
  const [carnets, setCarnets] = useState<CarnetRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarnets();
  }, []);

  async function fetchCarnets(q?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/carnets?${params}`);
    const json = await res.json();
    if (json.success) setCarnets(json.data.items);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Carnés</h1>
          <p className="text-muted-foreground">Consulta y gestión de carnés emitidos</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/carnets/masivo" variant="outline">
            Carga masiva
          </ButtonLink>
          <ButtonLink href="/carnets/generar" className="bg-[#0066CC]">
            <Plus className="mr-2 h-4 w-4" />
            Generar carné
          </ButtonLink>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outline" onClick={() => fetchCarnets(search)}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : carnets.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">No hay carnés</TableCell></TableRow>
            ) : (
              carnets.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.codigoUnico}</TableCell>
                  <TableCell>{c.nombreCompleto}</TableCell>
                  <TableCell>{c.documento}</TableCell>
                  <TableCell className="text-sm">{c.centroNombre ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={c.estado} /></TableCell>
                  <TableCell>{new Date(c.fechaVencimiento).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell className="flex gap-1">
                    <ButtonLink href={`/carnets/${c.id}`} variant="ghost" size="sm">
                      Ver
                    </ButtonLink>
                    <a
                      href={`/api/carnets/${c.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <FileDown className="h-4 w-4" />
                    </a>
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
