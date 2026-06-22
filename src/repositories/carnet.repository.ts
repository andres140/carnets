import { prisma } from "@/lib/prisma";
import type { Prisma, EstadoCarnet } from "@/generated/prisma/client";

const carnetSelect = {
  id: true,
  codigoUnico: true,
  nombreCompleto: true,
  documento: true,
  tipoUsuario: true,
  estado: true,
  fechaExpedicion: true,
  fechaVencimiento: true,
  centroNombre: true,
  regionalNombre: true,
  fotoUrl: true,
  qrToken: true,
  pdfGeneradoUrl: true,
  usuarioId: true,
  createdAt: true,
  usuario: {
    select: {
      dependencia: { select: { nombre: true } },
    },
  },
  emitidoPor: { select: { nombreCompleto: true } },
};

export const carnetRepository = {
  async findById(id: string) {
    return prisma.carnet.findUnique({
      where: { id },
      select: carnetSelect,
    });
  },

  async findByQrToken(qrToken: string) {
    return prisma.carnet.findUnique({
      where: { qrToken },
      select: carnetSelect,
    });
  },

  async findByCodigoUnico(codigoUnico: string) {
    return prisma.carnet.findUnique({
      where: { codigoUnico },
      select: carnetSelect,
    });
  },

  async findActiveByUsuarioId(usuarioId: string) {
    return prisma.carnet.findFirst({
      where: {
        usuarioId,
        estado: { in: ["ACTIVO", "VENCIDO", "SUSPENDIDO"] },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    estado?: EstadoCarnet;
    regionalNombre?: string;
    usuarioId?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where: Prisma.CarnetWhereInput = {};

    if (params.estado) where.estado = params.estado;
    if (params.regionalNombre) where.regionalNombre = params.regionalNombre;
    if (params.usuarioId) where.usuarioId = params.usuarioId;
    if (params.search) {
      where.OR = [
        { nombreCompleto: { contains: params.search } },
        { documento: { contains: params.search } },
        { codigoUnico: { contains: params.search } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.carnet.findMany({
        where,
        select: carnetSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.carnet.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async create(data: Prisma.CarnetCreateInput) {
    return prisma.carnet.create({
      data,
      select: carnetSelect,
    });
  },

  async update(id: string, data: Prisma.CarnetUpdateInput) {
    return prisma.carnet.update({
      where: { id },
      data,
      select: carnetSelect,
    });
  },

  async countByEstado() {
    const groups = await prisma.carnet.groupBy({
      by: ["estado"],
      _count: { estado: true },
    });
    return groups.reduce(
      (acc, g) => {
        acc[g.estado] = g._count.estado;
        return acc;
      },
      {} as Record<string, number>
    );
  },

  async countProximosVencimientos(dias: number) {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    return prisma.carnet.count({
      where: {
        estado: "ACTIVO",
        fechaVencimiento: { lte: limite, gte: new Date() },
      },
    });
  },
};
