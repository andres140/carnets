import { TIPO_USUARIO_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface CarnetPreviewProps {
  nombreCompleto: string;
  documento: string;
  tipoUsuario: string;
  centroNombre?: string | null;
  regionalNombre?: string | null;
  codigoUnico?: string;
  fotoUrl?: string | null;
  fechaExpedicion?: string;
  fechaVencimiento?: string;
  qrDataUrl?: string;
}

export function CarnetPreview({
  nombreCompleto,
  documento,
  tipoUsuario,
  centroNombre,
  regionalNombre,
  codigoUnico,
  fotoUrl,
  fechaExpedicion,
  fechaVencimiento,
  qrDataUrl,
}: CarnetPreviewProps) {
  return (
    <div className="w-full max-w-md rounded-xl border-2 border-[#0066CC] bg-white p-4 shadow-lg">
      <div className="mb-3 text-center text-xs font-bold text-[#0066CC]">
        SENA — Servicio Nacional de Aprendizaje
      </div>
      <div className="flex gap-4">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{nombreCompleto}</h3>
          <p className="text-sm text-muted-foreground">Doc: {documento}</p>
          <p className="text-sm">{TIPO_USUARIO_LABELS[tipoUsuario] ?? tipoUsuario}</p>
          <p className="text-xs text-muted-foreground truncate">
            {centroNombre ?? "—"} · {regionalNombre ?? "—"}
          </p>
          {codigoUnico && (
            <p className="mt-1 text-xs font-mono">{codigoUnico}</p>
          )}
        </div>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR" className="h-16 w-16 shrink-0" />
        )}
      </div>
      {(fechaExpedicion || fechaVencimiento) && (
        <div className="mt-3 flex justify-between text-xs text-muted-foreground border-t pt-2">
          <span>Exp: {fechaExpedicion ?? "—"}</span>
          <span>Vence: {fechaVencimiento ?? "—"}</span>
        </div>
      )}
    </div>
  );
}

export function CarnetCard({
  carnet,
}: {
  carnet: {
    codigoUnico: string;
    nombreCompleto: string;
    estado: string;
    fechaVencimiento: string;
  };
}) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{carnet.nombreCompleto}</p>
          <p className="text-sm font-mono text-muted-foreground">{carnet.codigoUnico}</p>
        </div>
        <StatusBadge status={carnet.estado} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Vence: {new Date(carnet.fechaVencimiento).toLocaleDateString("es-CO")}
      </p>
    </div>
  );
}
