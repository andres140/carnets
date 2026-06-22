import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { SessionUser } from "@/types/usuario";

export async function getApiSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nombreCompleto: session.user.nombreCompleto,
    tipoUsuario: session.user.tipoUsuario as SessionUser["tipoUsuario"],
    rolId: session.user.rolId,
    rolNombre: session.user.rolNombre,
    regionalId: session.user.regionalId,
    centroId: session.user.centroId,
    permisos: session.user.permisos,
  };
}

export async function requireApiSession(): Promise<SessionUser> {
  const user = await getApiSession();
  if (!user) throw new ApiError("No autorizado", 401);
  return user;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireApiSession();
  if (!hasPermission(user, permission)) {
    throw new ApiError("Sin permisos", 403);
  }
  return user;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export function getClientIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}
