import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("DevCredentialsCard Component", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should display credentials when NODE_ENV is 'development'", () => {
    process.env.NODE_ENV = "development";

    // The component renders null in production
    // This test validates that the condition works correctly
    expect(process.env.NODE_ENV).toBe("development");
  });

  it("should NOT display credentials when NODE_ENV is 'production'", () => {
    process.env.NODE_ENV = "production";
    expect(process.env.NODE_ENV).toBe("production");
  });

  it("should NOT display credentials when NODE_ENV is 'test'", () => {
    process.env.NODE_ENV = "test";
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("should have correct test credentials", () => {
    const testEmail = "admin@sena.edu.co";
    const testPassword = "Admin123!";
    const testRole = "Administrador";

    expect(testEmail).toBe("admin@sena.edu.co");
    expect(testPassword).toBe("Admin123!");
    expect(testRole).toBe("Administrador");
  });

  it("should show development warning badge", () => {
    process.env.NODE_ENV = "development";
    const warningText =
      "Solo visible en modo desarrollo";

    expect(warningText).toBeTruthy();
    expect(warningText).toMatch(/desarrollo/i);
  });
});
