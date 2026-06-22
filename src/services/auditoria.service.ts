import { auditRepository } from "@/repositories/audit.repository";
import type { Prisma } from "@/generated/prisma/client";

export const auditoriaService = {
  async log(params: {
    usuarioId?: string | null;
    accion: string;
    entidad: string;
    entidadId?: string | null;
    detalle?: Record<string, unknown>;
    ip?: string | null;
  }) {
    return auditRepository.create({
      usuarioId: params.usuarioId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId,
      detalleJson: params.detalle as Prisma.InputJsonValue,
      ip: params.ip,
    });
  },

  async list(params: {
    page?: number;
    pageSize?: number;
    entidad?: string;
    usuarioId?: string;
    desde?: string;
    hasta?: string;
  }) {
    return auditRepository.findMany({
      page: params.page,
      pageSize: params.pageSize,
      entidad: params.entidad,
      usuarioId: params.usuarioId,
      desde: params.desde ? new Date(params.desde) : undefined,
      hasta: params.hasta ? new Date(params.hasta) : undefined,
    });
  },
};
