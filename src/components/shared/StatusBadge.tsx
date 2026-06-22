import { cn } from "@/lib/utils";
import { ESTADO_CARNET_LABELS, ESTADO_USUARIO_LABELS } from "@/lib/constants";

const estadoStyles: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-800 border-green-200",
  VENCIDO: "bg-amber-100 text-amber-800 border-amber-200",
  SUSPENDIDO: "bg-orange-100 text-orange-800 border-orange-200",
  REVOCADO: "bg-red-100 text-red-800 border-red-200",
  INACTIVO: "bg-gray-100 text-gray-800 border-gray-200",
};

export function StatusBadge({
  status,
  type = "carnet",
}: {
  status: string;
  type?: "carnet" | "usuario";
}) {
  const label =
    type === "usuario"
      ? ESTADO_USUARIO_LABELS[status] ?? status
      : ESTADO_CARNET_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        estadoStyles[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {label}
    </span>
  );
}
