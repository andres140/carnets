import { prisma } from "@/lib/prisma";
import type { Prisma, EstadoUsuario } from "@/generated/prisma/client";

const usuarioSelect = {
  id: true,
  email: true,
  documento: true,
  nombreCompleto: true,
  tipoUsuario: true,
  estado: true,
  fotoUrl: true,
  tipoDocumento: true,
  telefono: true,
  rolId: true,
  regionalId: true,
  centroId: true,
  dependenciaId: true,
  createdAt: true,
  rol: { select: { nombre: true } },
  regional: { select: { nombre: true } },
  centro: { select: { nombre: true } },
};

export const usuarioRepository = {
  async findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: {
          include: {
            permisos: { include: { permiso: true } },
          },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });
  },

  async findByDocumento(documento: string) {
    return prisma.usuario.findUnique({ where: { documento } });
  },

  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    regionalId?: string;
    centroId?: string;
    estado?: EstadoUsuario;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where: Prisma.UsuarioWhereInput = {};

    if (params.regionalId) where.regionalId = params.regionalId;
    if (params.centroId) where.centroId = params.centroId;
    if (params.estado) where.estado = params.estado;
    if (params.search) {
      where.OR = [
        { nombreCompleto: { contains: params.search } },
        { documento: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        select: usuarioSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.usuario.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async create(data: Prisma.UsuarioCreateInput) {
    return prisma.usuario.create({
      data,
      select: usuarioSelect,
    });
  },

  async update(id: string, data: Prisma.UsuarioUpdateInput) {
    return prisma.usuario.update({
      where: { id },
      data,
      select: usuarioSelect,
    });
  },
};
