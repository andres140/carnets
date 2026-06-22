import { NextRequest } from "next/server";
import { requirePermission, getClientIp, ApiError } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { carnetService } from "@/services/carnet.service";
import { cambiarEstadoCarnetSchema } from "@/schemas/carnet.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("carnets.ver");
    const { id } = await params;
    const carnet = await carnetService.getById(id, actor);
    if (!carnet) return apiError(new ApiError("No encontrado", 404));
    const historial = await carnetService.getHistorialEstados(id);
    return apiSuccess({ carnet, historial });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("carnets.suspender");
    const { id } = await params;
    const body = await request.json();
    const input = cambiarEstadoCarnetSchema.parse(body);
    const carnet = await carnetService.cambiarEstado(id, input, actor, getClientIp(request));
    return apiSuccess(carnet, "Estado actualizado");
  } catch (e) {
    return apiError(e);
  }
}
