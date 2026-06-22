"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarnetPreview } from "@/components/carnets/CarnetPreview";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";

export default function CarnetDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<{
    carnet: Record<string, unknown>;
    historial: Array<Record<string, unknown>>;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>();

  useEffect(() => {
    fetch(`/api/carnets/${id}`)
      .then((r) => r.json())
      .then(async (j) => {
        if (j.success) {
          setData(j.data);
          const carnet = j.data.carnet;
          if (carnet.qrToken) {
            const QRCode = await import("qrcode");
            const base = window.location.origin;
            const url = `${base}/validar?token=${encodeURIComponent(carnet.qrToken as string)}`;
            const dataUrl = await QRCode.toDataURL(url, { width: 150 });
            setQrDataUrl(dataUrl);
          }
        }
      });
  }, [id]);

  async function cambiarEstado(estado: string) {
    const res = await fetch(`/api/carnets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, motivo: "Cambio manual" }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Estado actualizado");
      setData((prev) => prev ? { ...prev, carnet: json.data } : null);
    } else {
      toast.error(json.error);
    }
  }

  if (!data) return <p>Cargando...</p>;

  const carnet = data.carnet;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Detalle del carné</h1>
          <p className="font-mono text-muted-foreground">{carnet.codigoUnico as string}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={carnet.estado as string} />
          <a
            href={`/api/carnets/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <CarnetPreview
        nombreCompleto={carnet.nombreCompleto as string}
        documento={carnet.documento as string}
        tipoUsuario={carnet.tipoUsuario as string}
        centroNombre={carnet.centroNombre as string}
        regionalNombre={carnet.regionalNombre as string}
        codigoUnico={carnet.codigoUnico as string}
        fotoUrl={carnet.fotoUrl as string}
        fechaExpedicion={new Date(carnet.fechaExpedicion as string).toLocaleDateString("es-CO")}
        fechaVencimiento={new Date(carnet.fechaVencimiento as string).toLocaleDateString("es-CO")}
        qrDataUrl={qrDataUrl}
      />

      <Card>
        <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => cambiarEstado("SUSPENDIDO")}>Suspender</Button>
          <Button variant="outline" onClick={() => cambiarEstado("ACTIVO")}>Activar</Button>
          <Button variant="destructive" onClick={() => cambiarEstado("REVOCADO")}>Revocar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial de estados</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.historial.map((h) => (
              <li key={h.id as string} className="text-sm border-b pb-2">
                <span className="font-medium">{h.estadoNuevo as string}</span>
                {(h.estadoAnterior as string | null) && (
                  <span className="text-muted-foreground">
                    {" "}(desde {h.estadoAnterior as string})
                  </span>
                )}
                <span className="text-muted-foreground"> — {(h.usuario as { nombreCompleto: string })?.nombreCompleto}</span>
                <span className="text-xs text-muted-foreground block">
                  {new Date(h.createdAt as string).toLocaleString("es-CO")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
