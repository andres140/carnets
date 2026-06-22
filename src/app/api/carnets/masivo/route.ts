import { NextRequest } from "next/server";
import { requirePermission, getClientIp } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { carnetService } from "@/services/carnet.service";
import { carnetMasivoRowSchema } from "@/schemas/carnet.schema";

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("carnets.generar_masivo");
    const body = await request.json();
    const rows = (body.rows as unknown[]).map((r) => carnetMasivoRowSchema.parse(r));
    const result = await carnetService.generarMasivo(rows, actor, getClientIp(request));
    return apiSuccess(result, "Carga masiva procesada");
  } catch (e) {
    return apiError(e);
  }
}
