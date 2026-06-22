import type { TipoUsuario, EstadoCarnet } from "@/generated/prisma/client";

export interface CarnetListItem {
  id: string;
  codigoUnico: string;
  nombreCompleto: string;
  documento: string;
  tipoUsuario: TipoUsuario;
  estado: EstadoCarnet;
  fechaExpedicion: string;
  fechaVencimiento: string;
  centroNombre: string | null;
  regionalNombre: string | null;
  createdAt: string;
}

export interface CarnetDetail extends CarnetListItem {
  fotoUrl: string | null;
  qrToken: string;
  pdfGeneradoUrl: string | null;
  usuarioId: string;
  emitidoPorNombre: string;
}

export interface CarnetValidacionSeguro {
  codigoUnico: string;
  nombreCompleto: string;
  documento: string;
  tipoUsuario: TipoUsuario;
  centroNombre: string | null;
  regionalNombre: string | null;
  fotoUrl: string | null;
  fechaExpedicion: Date;
  fechaVencimiento: Date;
}

export interface ValidacionQrResult {
  valido: boolean;
  estado: EstadoCarnet | null;
  carnet: CarnetValidacionSeguro | null;
  mensaje: string;
}
