import { NextRequest } from "next/server";
import { requirePermission, getClientIp } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { carnetService } from "@/services/carnet.service";
import { generarCarnetSchema } from "@/schemas/carnet.schema";

export async function GET(request: NextRequest) {
  try {
    const actor = await requirePermission("carnets.ver");
    const { searchParams } = request.nextUrl;
    const result = await carnetService.list({
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      search: searchParams.get("search") ?? undefined,
      estado: searchParams.get("estado") as import("@/generated/prisma/client").EstadoCarnet | undefined,
    }, actor);
    return apiSuccess(result);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("carnets.generar");
    const body = await request.json();
    const input = generarCarnetSchema.parse(body);
    const carnet = await carnetService.generar(input, actor, getClientIp(request));
    return apiSuccess(carnet, "Carné generado");
  } catch (e) {
    return apiError(e);
  }
}
