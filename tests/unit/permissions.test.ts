import { describe, it, expect } from "vitest";
import { hasPermission, canAccessRegional } from "@/lib/permissions";
import type { SessionUser } from "@/types/usuario";

const mockUser: SessionUser = {
  id: "1",
  email: "test@sena.edu.co",
  nombreCompleto: "Test User",
  tipoUsuario: "COORDINADOR",
  rolId: "rol1",
  rolNombre: "COORDINADOR",
  regionalId: "reg1",
  centroId: "centro1",
  permisos: ["usuarios.ver", "carnets.generar"],
};

describe("permissions", () => {
  it("checks permission correctly", () => {
    expect(hasPermission(mockUser, "usuarios.ver")).toBe(true);
    expect(hasPermission(mockUser, "roles.gestionar")).toBe(false);
    expect(hasPermission(null, "usuarios.ver")).toBe(false);
  });

  it("checks regional access for coordinador", () => {
    expect(canAccessRegional(mockUser, "reg1")).toBe(true);
    expect(canAccessRegional(mockUser, "reg2")).toBe(false);
  });
});
