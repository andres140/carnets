import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { configService } from "@/services/config.service";

export async function GET() {
  try {
    await requirePermission("roles.gestionar");
    const roles = await configService.listRoles();
    const permisos = await configService.listPermisos();
    return apiSuccess({ roles, permisos });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requirePermission("roles.gestionar");
    const body = await request.json();
    const rol = await configService.updateRolPermisos(
      body.rolId,
      body.permisoIds,
      actor.id
    );
    return apiSuccess(rol, "Permisos actualizados");
  } catch (e) {
    return apiError(e);
  }
}
