import { z } from "zod";
import { ESTADOS_CARNET } from "@/lib/constants";

export const generarCarnetSchema = z.object({
  usuarioId: z.string().min(1, "Usuario requerido"),
  fechaVencimiento: z.string().min(1, "Fecha de vencimiento requerida"),
});

export const cambiarEstadoCarnetSchema = z.object({
  estado: z.enum(ESTADOS_CARNET),
  motivo: z.string().max(500).optional(),
});

export const carnetMasivoRowSchema = z.object({
  documento: z.string().min(5),
  nombreCompleto: z.string().min(3),
  tipoUsuario: z.string(),
  email: z.string().email().optional(),
  centroCodigo: z.string().optional(),
  fechaVencimiento: z.string().optional(),
});

export type GenerarCarnetInput = z.infer<typeof generarCarnetSchema>;
export type CambiarEstadoCarnetInput = z.infer<typeof cambiarEstadoCarnetSchema>;
