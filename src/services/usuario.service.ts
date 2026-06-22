import bcrypt from "bcryptjs";
import { usuarioRepository } from "@/repositories/usuario.repository";
import { auditoriaService } from "./auditoria.service";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "@/schemas/usuario.schema";
import type { SessionUser } from "@/types/usuario";
import { canAccessRegional } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function mapToSessionUser(
  usuario: NonNullable<Awaited<ReturnType<typeof usuarioRepository.findByEmail>>>
): SessionUser {
  return {
    id: usuario.id,
    email: usuario.email,
    nombreCompleto: usuario.nombreCompleto,
    tipoUsuario: usuario.tipoUsuario,
    rolId: usuario.rolId,
    rolNombre: usuario.rol.nombre,
    regionalId: usuario.regionalId,
    centroId: usuario.centroId,
    permisos: usuario.rol.permisos.map((rp) => rp.permiso.codigo),
  };
}

export const usuarioService = {
  async authenticate(email: string, password: string) {
    const usuario = await usuarioRepository.findByEmail(email);
    if (!usuario || usuario.estado !== "ACTIVO") return null;

    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) return null;

    return mapToSessionUser(usuario);
  },

  async getSessionUser(id: string): Promise<SessionUser | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        rol: {
          include: {
            permisos: { include: { permiso: true } },
          },
        },
      },
    });
    if (!usuario) return null;
    return {
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      tipoUsuario: usuario.tipoUsuario,
      rolId: usuario.rolId,
      rolNombre: usuario.rol.nombre,
      regionalId: usuario.regionalId,
      centroId: usuario.centroId,
      permisos: usuario.rol.permisos.map((rp) => rp.permiso.codigo),
    };
  },

  async list(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      regionalId?: string;
      centroId?: string;
    },
    actor?: SessionUser
  ) {
    const filters = { ...params };
    if (actor && actor.tipoUsuario === "COORDINADOR" && actor.regionalId) {
      filters.regionalId = actor.regionalId;
    }
  if (actor && actor.tipoUsuario === "INSTRUCTOR" && actor.centroId) {
      filters.centroId = actor.centroId;
    }
    return usuarioRepository.findMany(filters);
  },

  async getById(id: string, actor?: SessionUser) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) return null;
    if (
      actor &&
      actor.tipoUsuario === "COORDINADOR" &&
      !canAccessRegional(actor, usuario.regionalId)
    ) {
      return null;
    }
    return usuario;
  },

  async create(input: CreateUsuarioInput, actor?: SessionUser, ip?: string) {
    const existing = await usuarioRepository.findByDocumento(input.documento);
    if (existing) throw new Error("Ya existe un usuario con ese documento.");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const usuario = await usuarioRepository.create({
      email: input.email,
      passwordHash,
      rol: { connect: { id: input.rolId } },
      tipoUsuario: input.tipoUsuario,
      documento: input.documento,
      tipoDocumento: input.tipoDocumento,
      nombreCompleto: input.nombreCompleto,
      telefono: input.telefono,
      fotoUrl: input.fotoUrl,
      regional: input.regionalId
        ? { connect: { id: input.regionalId } }
        : undefined,
      centro: input.centroId ? { connect: { id: input.centroId } } : undefined,
      dependencia: input.dependenciaId
        ? { connect: { id: input.dependenciaId } }
        : undefined,
    });

    await auditoriaService.log({
      usuarioId: actor?.id,
      accion: "CREAR",
      entidad: "Usuario",
      entidadId: usuario.id,
      detalle: { email: input.email, documento: input.documento },
      ip,
    });

    return usuario;
  },

  async update(
    id: string,
    input: UpdateUsuarioInput,
    actor?: SessionUser,
    ip?: string
  ) {
    const existing = await usuarioRepository.findById(id);
    if (!existing) throw new Error("Usuario no encontrado.");
    if (
      actor &&
      actor.tipoUsuario === "COORDINADOR" &&
      !canAccessRegional(actor, existing.regionalId)
    ) {
      throw new Error("Sin permisos para editar este usuario.");
    }

    const data: Record<string, unknown> = {
      email: input.email,
      rol: { connect: { id: input.rolId } },
      tipoUsuario: input.tipoUsuario,
      documento: input.documento,
      tipoDocumento: input.tipoDocumento,
      nombreCompleto: input.nombreCompleto,
      telefono: input.telefono,
      fotoUrl: input.fotoUrl,
      estado: input.estado,
      regional: input.regionalId
        ? { connect: { id: input.regionalId } }
        : { disconnect: true },
      centro: input.centroId
        ? { connect: { id: input.centroId } }
        : { disconnect: true },
      dependencia: input.dependenciaId
        ? { connect: { id: input.dependenciaId } }
        : { disconnect: true },
    };

    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }

    const usuario = await usuarioRepository.update(id, data);

    await auditoriaService.log({
      usuarioId: actor?.id,
      accion: "ACTUALIZAR",
      entidad: "Usuario",
      entidadId: id,
      detalle: { email: input.email },
      ip,
    });

    return usuario;
  },

  async deactivate(id: string, actor?: SessionUser, ip?: string) {
    const existing = await usuarioRepository.findById(id);
    if (!existing) throw new Error("Usuario no encontrado.");

    const usuario = await usuarioRepository.update(id, {
      estado: "INACTIVO",
      deactivatedAt: new Date(),
    });

    await auditoriaService.log({
      usuarioId: actor?.id,
      accion: "DESACTIVAR",
      entidad: "Usuario",
      entidadId: id,
      ip,
    });

    return usuario;
  },
};
