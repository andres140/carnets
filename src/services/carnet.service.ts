import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { carnetRepository } from "@/repositories/carnet.repository";
import { usuarioRepository } from "@/repositories/usuario.repository";
import { auditoriaService } from "./auditoria.service";
import { qrService } from "./qr.service";
import type { GenerarCarnetInput, CambiarEstadoCarnetInput } from "@/schemas/carnet.schema";
import type { SessionUser } from "@/types/usuario";
import type { EstadoCarnet, TipoUsuario } from "@/generated/prisma/client";
import { canAccessRegional } from "@/lib/permissions";

async function generateCodigoUnico(regionalCodigo: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${regionalCodigo}-${year}-`;
  const count = await prisma.carnet.count({
    where: { codigoUnico: { startsWith: prefix } },
  });
  const sequence = String(count + 1).padStart(6, "0");
  return `${prefix}${sequence}`;
}

function resolveEstado(fechaVencimiento: Date, estado: EstadoCarnet): EstadoCarnet {
  if (estado === "REVOCADO" || estado === "SUSPENDIDO") return estado;
  if (fechaVencimiento < new Date()) return "VENCIDO";
  return estado;
}

export const carnetService = {
  async list(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      estado?: EstadoCarnet;
      usuarioId?: string;
    },
    actor?: SessionUser
  ) {
    const filters = { ...params };

    if (actor?.tipoUsuario === "APRENDIZ" || actor?.tipoUsuario === "CONTRATISTA") {
      filters.usuarioId = actor.id;
    }

    if (actor?.tipoUsuario === "COORDINADOR" && actor.regionalId) {
      const regional = await prisma.regional.findUnique({
        where: { id: actor.regionalId },
      });
      if (regional) {
        return carnetRepository.findMany({
          ...filters,
          regionalNombre: regional.nombre,
        });
      }
    }

    return carnetRepository.findMany(filters);
  },

  async getById(id: string, actor?: SessionUser) {
    const carnet = await carnetRepository.findById(id);
    if (!carnet) return null;

    if (
      actor?.tipoUsuario === "APRENDIZ" ||
      actor?.tipoUsuario === "CONTRATISTA"
    ) {
      if (carnet.usuarioId !== actor.id) return null;
    }

    return carnet;
  },

  async generar(input: GenerarCarnetInput, actor: SessionUser, ip?: string) {
    const usuario = await usuarioRepository.findById(input.usuarioId);
    if (!usuario) throw new Error("Usuario no encontrado.");
    if (usuario.estado !== "ACTIVO") {
      throw new Error("El usuario no está activo.");
    }

    if (
      actor.tipoUsuario === "COORDINADOR" &&
      !canAccessRegional(actor, usuario.regionalId)
    ) {
      throw new Error("Sin permisos para generar carné en esta regional.");
    }

    const activeCarnet = await carnetRepository.findActiveByUsuarioId(
      input.usuarioId
    );
    if (activeCarnet && activeCarnet.estado === "ACTIVO") {
      throw new Error("El usuario ya tiene un carné activo.");
    }

    const regional = usuario.regionalId
      ? await prisma.regional.findUnique({ where: { id: usuario.regionalId } })
      : null;
    const regionalCodigo = regional?.codigo ?? "REG00";

    const codigoUnico = await generateCodigoUnico(regionalCodigo);
    const qrToken = qrService.generateToken();
    const fechaExpedicion = new Date();
    const fechaVencimiento = new Date(input.fechaVencimiento);

    const carnet = await carnetRepository.create({
      codigoUnico,
      qrToken,
      estado: "ACTIVO",
      fechaExpedicion,
      fechaVencimiento,
      fotoUrl: usuario.fotoUrl,
      nombreCompleto: usuario.nombreCompleto,
      documento: usuario.documento,
      tipoUsuario: usuario.tipoUsuario,
      centroNombre: usuario.centro?.nombre ?? null,
      regionalNombre: usuario.regional?.nombre ?? null,
      usuario: { connect: { id: usuario.id } },
      emitidoPor: { connect: { id: actor.id } },
    });

    await prisma.carnetEstadoHistorial.create({
      data: {
        carnetId: carnet.id,
        estadoNuevo: "ACTIVO",
        motivo: "Emisión inicial",
        usuarioId: actor.id,
      },
    });

    await auditoriaService.log({
      usuarioId: actor.id,
      accion: "GENERAR",
      entidad: "Carnet",
      entidadId: carnet.id,
      detalle: { codigoUnico, usuarioId: input.usuarioId },
      ip,
    });

    return carnet;
  },

  async cambiarEstado(
    id: string,
    input: CambiarEstadoCarnetInput,
    actor: SessionUser,
    ip?: string
  ) {
    const carnet = await carnetRepository.findById(id);
    if (!carnet) throw new Error("Carné no encontrado.");

    const nuevoEstado = input.estado;

    await carnetRepository.update(id, { estado: nuevoEstado });

    await prisma.carnetEstadoHistorial.create({
      data: {
        carnetId: id,
        estadoAnterior: carnet.estado,
        estadoNuevo: nuevoEstado,
        motivo: input.motivo,
        usuarioId: actor.id,
      },
    });

    await auditoriaService.log({
      usuarioId: actor.id,
      accion: "CAMBIAR_ESTADO",
      entidad: "Carnet",
      entidadId: id,
      detalle: { estadoAnterior: carnet.estado, estadoNuevo: nuevoEstado },
      ip,
    });

    return carnetRepository.findById(id);
  },

  async validarQr(token: string, ip?: string, usuarioId?: string) {
    if (!qrService.verifyToken(token)) {
      return {
        valido: false,
        estado: null,
        carnet: null,
        mensaje: "Token QR inválido o corrupto.",
      };
    }

    const carnet = await carnetRepository.findByQrToken(token);
    if (!carnet) {
      return {
        valido: false,
        estado: null,
        carnet: null,
        mensaje: "Carné no encontrado.",
      };
    }

    const estado = resolveEstado(
      new Date(carnet.fechaVencimiento),
      carnet.estado
    );

    if (estado === "VENCIDO" && carnet.estado === "ACTIVO") {
      await carnetRepository.update(carnet.id, { estado: "VENCIDO" });
    }

    const valido = estado === "ACTIVO";

    await prisma.validacionQr.create({
      data: {
        carnetId: carnet.id,
        ip,
        resultado: valido ? "VALIDO" : estado,
        usuarioId,
      },
    });

    // Información segura para mostrar al público (sin datos sensibles)
    const carnetSeguro = {
      codigoUnico: carnet.codigoUnico,
      nombreCompleto: carnet.nombreCompleto,
      documento: carnet.documento,
      tipoUsuario: carnet.tipoUsuario,
      centroNombre: carnet.centroNombre,
      regionalNombre: carnet.regionalNombre,
      fotoUrl: carnet.fotoUrl,
      fechaExpedicion: carnet.fechaExpedicion,
      fechaVencimiento: carnet.fechaVencimiento,
    };

    return {
      valido,
      estado,
      carnet: carnetSeguro,
      mensaje: valido
        ? "Carné vigente y válido."
        : `Carné no válido. Estado: ${estado}`,
    };
  },

  async getHistorialEstados(carnetId: string) {
    return prisma.carnetEstadoHistorial.findMany({
      where: { carnetId },
      include: { usuario: { select: { nombreCompleto: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async generarMasivo(
    rows: Array<{
      documento: string;
      nombreCompleto: string;
      tipoUsuario: string;
      email?: string;
      centroCodigo?: string;
      fechaVencimiento?: string;
    }>,
    actor: SessionUser,
    ip?: string
  ) {
    const resultados = { exitos: 0, errores: 0, detalles: [] as string[] };

    for (const row of rows) {
      try {
        let usuarioId: string | undefined;

        const existing = await usuarioRepository.findByDocumento(row.documento);
        if (existing) {
          usuarioId = existing.id;
        } else {
          const rol = await prisma.rol.findFirst({
            where: { nombre: row.tipoUsuario },
          });
          if (!rol) throw new Error(`Rol no encontrado: ${row.tipoUsuario}`);

          let centroId: string | undefined;
          if (row.centroCodigo) {
            const centro = await prisma.centroFormacion.findUnique({
              where: { codigo: row.centroCodigo },
            });
            centroId = centro?.id;
          }

          const passwordHash = await bcrypt.hash("TempPass123!", 12);
          const created = await usuarioRepository.create({
            email: row.email ?? `${row.documento}@sena.edu.co`,
            passwordHash,
            rol: { connect: { id: rol.id } },
            tipoUsuario: row.tipoUsuario as TipoUsuario,
            documento: row.documento,
            tipoDocumento: "CC",
            nombreCompleto: row.nombreCompleto,
            centro: centroId ? { connect: { id: centroId } } : undefined,
          });
          usuarioId = created.id;

          await auditoriaService.log({
            usuarioId: actor.id,
            accion: "CREAR",
            entidad: "Usuario",
            entidadId: created.id,
            detalle: { documento: row.documento, masivo: true },
            ip,
          });
        }

        if (!usuarioId) throw new Error("No se pudo crear/obtener usuario.");

        const vencimiento =
          row.fechaVencimiento ??
          new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            .toISOString()
            .split("T")[0];

        await this.generar(
          { usuarioId, fechaVencimiento: vencimiento },
          actor,
          ip
        );
        resultados.exitos++;
      } catch (e) {
        resultados.errores++;
        resultados.detalles.push(
          `${row.documento}: ${e instanceof Error ? e.message : "Error"}`
        );
      }
    }

    const carga = await prisma.cargaMasiva.create({
      data: {
        archivo: "importacion.csv",
        total: rows.length,
        exitos: resultados.exitos,
        errores: resultados.errores,
        detalle: resultados,
        usuarioId: actor.id,
      },
    });

    await auditoriaService.log({
      usuarioId: actor.id,
      accion: "GENERAR_MASIVO",
      entidad: "CargaMasiva",
      entidadId: carga.id,
      detalle: resultados,
      ip,
    });

    return { ...resultados, cargaId: carga.id };
  },
};
