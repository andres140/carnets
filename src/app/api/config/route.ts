import { NextRequest } from "next/server";
import { requirePermission, ApiError } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { configService } from "@/services/config.service";
import { regionalSchema, centroSchema } from "@/schemas/config.schema";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("config.gestionar");
    const { searchParams } = request.nextUrl;
    const tipo = searchParams.get("tipo");

    if (tipo === "centros") {
      return apiSuccess(await configService.listCentros(searchParams.get("regionalId") ?? undefined));
    }
    if (tipo === "dependencias") {
      return apiSuccess(await configService.listDependencias(searchParams.get("centroId") ?? undefined));
    }
    return apiSuccess(await configService.listRegionales());
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("config.gestionar");
    const body = await request.json();
    const tipo = body.tipo as string;

    if (tipo === "regional") {
      const input = regionalSchema.parse(body.data);
      const regional = await configService.createRegional(input, actor.id);
      return apiSuccess(regional, "Regional creada");
    }
    if (tipo === "centro") {
      const input = centroSchema.parse(body.data);
      const centro = await configService.createCentro(input, actor.id);
      return apiSuccess(centro, "Centro creado");
    }
    return apiError(new ApiError("Tipo inválido", 400));
  } catch (e) {
    return apiError(e);
  }
}
