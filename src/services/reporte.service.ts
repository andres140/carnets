import { prisma } from "@/lib/prisma";
import { carnetRepository } from "@/repositories/carnet.repository";
import type { ReporteResumen } from "@/types/api";
import type { SessionUser } from "@/types/usuario";

export const reporteService = {
  async getResumen(actor?: SessionUser): Promise<ReporteResumen> {
    const regionalFilter =
      actor?.tipoUsuario === "COORDINADOR" && actor.regionalId
        ? { regionalId: actor.regionalId }
        : {};
    void regionalFilter; // scope applied in usuarioWhere below

    const usuarioWhere =
      actor?.tipoUsuario === "COORDINADOR" && actor.regionalId
        ? { regionalId: actor.regionalId }
        : {};

    const carnetsPorEstado = await carnetRepository.countByEstado();
    const proximosVencimientos = await carnetRepository.countProximosVencimientos(30);

    const carnetsPorCentro = await prisma.carnet.groupBy({
      by: ["centroNombre"],
      _count: { centroNombre: true },
      where: {
        centroNombre: { not: null },
        ...(actor?.tipoUsuario === "COORDINADOR" && actor.regionalId
          ? {
              regionalNombre: (
                await prisma.regional.findUnique({
                  where: { id: actor.regionalId },
                })
              )?.nombre,
            }
          : {}),
      },
      orderBy: { _count: { centroNombre: "desc" } },
      take: 10,
    });

    const carnetsPorTipo = await prisma.carnet.groupBy({
      by: ["tipoUsuario"],
      _count: { tipoUsuario: true },
    });

    const totalUsuarios = await prisma.usuario.count({ where: usuarioWhere });
    const totalCarnets = await prisma.carnet.count();

    return {
      carnetsPorEstado,
      carnetsPorCentro: carnetsPorCentro.map((c) => ({
        centro: c.centroNombre ?? "Sin centro",
        total: c._count.centroNombre,
      })),
      carnetsPorTipo: carnetsPorTipo.reduce(
        (acc, g) => {
          acc[g.tipoUsuario] = g._count.tipoUsuario;
          return acc;
        },
        {} as Record<string, number>
      ),
      proximosVencimientos,
      totalUsuarios,
      totalCarnets,
    };
  },

  async exportCarnetsCsv(actor?: SessionUser): Promise<string> {
    const { items } = await carnetRepository.findMany({
      pageSize: 10000,
      regionalNombre:
        actor?.tipoUsuario === "COORDINADOR" && actor.regionalId
          ? (
              await prisma.regional.findUnique({
                where: { id: actor.regionalId },
              })
            )?.nombre
          : undefined,
    });

    const headers = [
      "codigo",
      "nombre",
      "documento",
      "tipo",
      "estado",
      "expedicion",
      "vencimiento",
      "centro",
      "regional",
    ];
    const rows = items.map((c) =>
      [
        c.codigoUnico,
        c.nombreCompleto,
        c.documento,
        c.tipoUsuario,
        c.estado,
        new Date(c.fechaExpedicion).toISOString().split("T")[0],
        new Date(c.fechaVencimiento).toISOString().split("T")[0],
        c.centroNombre ?? "",
        c.regionalNombre ?? "",
      ].join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  },
};
