import { prisma } from "@/lib/prisma";
import { auditoriaService } from "./auditoria.service";
import type { RegionalInput, CentroInput } from "@/schemas/config.schema";

export const configService = {
  async listRegionales() {
    return prisma.regional.findMany({
      orderBy: { nombre: "asc" },
      include: { centros: { where: { activo: true } } },
    });
  },

  async createRegional(input: RegionalInput, usuarioId?: string) {
    const regional = await prisma.regional.create({ data: input });
    await auditoriaService.log({
      usuarioId,
      accion: "CREAR",
      entidad: "Regional",
      entidadId: regional.id,
      detalle: input,
    });
    return regional;
  },

  async updateRegional(
    id: string,
    input: Partial<RegionalInput>,
    usuarioId?: string
  ) {
    const regional = await prisma.regional.update({ where: { id }, data: input });
    await auditoriaService.log({
      usuarioId,
      accion: "ACTUALIZAR",
      entidad: "Regional",
      entidadId: id,
      detalle: input,
    });
    return regional;
  },

  async listCentros(regionalId?: string) {
    return prisma.centroFormacion.findMany({
      where: regionalId ? { regionalId } : undefined,
      orderBy: { nombre: "asc" },
      include: { regional: { select: { nombre: true, codigo: true } } },
    });
  },

  async createCentro(input: CentroInput, usuarioId?: string) {
    const centro = await prisma.centroFormacion.create({ data: input });
    await auditoriaService.log({
      usuarioId,
      accion: "CREAR",
      entidad: "CentroFormacion",
      entidadId: centro.id,
      detalle: input,
    });
    return centro;
  },

  async updateCentro(
    id: string,
    input: Partial<CentroInput>,
    usuarioId?: string
  ) {
    const centro = await prisma.centroFormacion.update({ where: { id }, data: input });
    await auditoriaService.log({
      usuarioId,
      accion: "ACTUALIZAR",
      entidad: "CentroFormacion",
      entidadId: id,
      detalle: input,
    });
    return centro;
  },

  async listDependencias(centroId?: string) {
    return prisma.dependencia.findMany({
      where: centroId ? { centroId } : undefined,
      orderBy: { nombre: "asc" },
    });
  },

  async listRoles() {
    return prisma.rol.findMany({
      include: {
        permisos: { include: { permiso: true } },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: "asc" },
    });
  },

  async updateRolPermisos(
    rolId: string,
    permisoIds: string[],
    usuarioId?: string
  ) {
    await prisma.rolPermiso.deleteMany({ where: { rolId } });
    await prisma.rolPermiso.createMany({
      data: permisoIds.map((permisoId) => ({ rolId, permisoId })),
    });
    await auditoriaService.log({
      usuarioId,
      accion: "ACTUALIZAR_PERMISOS",
      entidad: "Rol",
      entidadId: rolId,
      detalle: { permisoIds },
    });
    return prisma.rol.findUnique({
      where: { id: rolId },
      include: { permisos: { include: { permiso: true } } },
    });
  },

  async listPermisos() {
    return prisma.permiso.findMany({ orderBy: { codigo: "asc" } });
  },
};
