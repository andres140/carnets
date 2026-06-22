import { NextRequest } from "next/server";
import { requirePermission, getClientIp, ApiError } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { usuarioService } from "@/services/usuario.service";
import { createUsuarioSchema, updateUsuarioSchema } from "@/schemas/usuario.schema";

export async function GET(request: NextRequest) {
  try {
    const actor = await requirePermission("usuarios.ver");
    const { searchParams } = request.nextUrl;
    const result = await usuarioService.list({
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      search: searchParams.get("search") ?? undefined,
      regionalId: searchParams.get("regionalId") ?? undefined,
      centroId: searchParams.get("centroId") ?? undefined,
    }, actor);
    return apiSuccess(result);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("usuarios.crear");
    const body = await request.json();
    const input = createUsuarioSchema.parse(body);
    const usuario = await usuarioService.create(input, actor, getClientIp(request));
    return apiSuccess(usuario, "Usuario creado");
  } catch (e) {
    return apiError(e);
  }
}
