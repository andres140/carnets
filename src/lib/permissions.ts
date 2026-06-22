import type { SessionUser } from "@/types/usuario";

export function hasPermission(
  user: SessionUser | null | undefined,
  permission: string
): boolean {
  if (!user?.permisos) return false;
  return user.permisos.includes(permission);
}

export function hasAnyPermission(
  user: SessionUser | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function canAccessRegional(
  user: SessionUser | null | undefined,
  regionalId: string | null | undefined
): boolean {
  if (!user) return false;
  if (user.tipoUsuario === "ADMINISTRADOR") return true;
  if (!regionalId || !user.regionalId) return false;
  return user.regionalId === regionalId;
}
