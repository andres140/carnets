import { NextRequest } from "next/server";
import { requirePermission, getClientIp, ApiError } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { usuarioService } from "@/services/usuario.service";
import { updateUsuarioSchema } from "@/schemas/usuario.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("usuarios.ver");
    const { id } = await params;
    const usuario = await usuarioService.getById(id, actor);
    if (!usuario) return apiError(new ApiError("No encontrado", 404));
    return apiSuccess(usuario);
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("usuarios.editar");
    const { id } = await params;
    const body = await request.json();
    const input = updateUsuarioSchema.parse(body);
    const usuario = await usuarioService.update(id, input, actor, getClientIp(request));
    return apiSuccess(usuario, "Usuario actualizado");
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("usuarios.desactivar");
    const { id } = await params;
    const usuario = await usuarioService.deactivate(id, actor, getClientIp(request));
    return apiSuccess(usuario, "Usuario desactivado");
  } catch (e) {
    return apiError(e);
  }
}
