import { describe, it, expect, beforeEach } from "vitest";
import { qrService } from "@/services/qr.service";

describe("qrService", () => {
  beforeEach(() => {
    process.env.QR_SIGNING_KEY = "test-key-for-vitest";
  });

  it("generates and verifies a valid token", () => {
    const token = qrService.generateToken();
    expect(qrService.verifyToken(token)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(qrService.verifyToken("invalid")).toBe(false);
    expect(qrService.verifyToken("abc.def")).toBe(false);
  });

  it("builds validation URL with token", () => {
    const url = qrService.buildValidationUrl("test.token");
    expect(url).toContain("/validar?token=");
    expect(url).toContain("test.token");
  });
});
