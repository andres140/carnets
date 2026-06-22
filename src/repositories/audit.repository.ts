import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const auditRepository = {
  async create(data: {
    usuarioId?: string | null;
    accion: string;
    entidad: string;
    entidadId?: string | null;
    detalleJson?: Prisma.InputJsonValue;
    ip?: string | null;
  }) {
    return prisma.auditLog.create({ data });
  },

  async findMany(params: {
    page?: number;
    pageSize?: number;
    entidad?: string;
    usuarioId?: string;
    desde?: Date;
    hasta?: Date;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where: Prisma.AuditLogWhereInput = {};

    if (params.entidad) where.entidad = params.entidad;
    if (params.usuarioId) where.usuarioId = params.usuarioId;
    if (params.desde || params.hasta) {
      where.createdAt = {};
      if (params.desde) where.createdAt.gte = params.desde;
      if (params.hasta) where.createdAt.lte = params.hasta;
    }

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          usuario: { select: { nombreCompleto: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },
};
