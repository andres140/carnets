import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { auditoriaService } from "@/services/auditoria.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("auditoria.ver");
    const { searchParams } = request.nextUrl;
    const result = await auditoriaService.list({
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      entidad: searchParams.get("entidad") ?? undefined,
      usuarioId: searchParams.get("usuarioId") ?? undefined,
      desde: searchParams.get("desde") ?? undefined,
      hasta: searchParams.get("hasta") ?? undefined,
    });
    return apiSuccess(result);
  } catch (e) {
    return apiError(e);
  }
}
