import { describe, it, expect } from "vitest";
import { qrService } from "@/services/qr.service";

describe("QR Service", () => {
  describe("Token generation and verification", () => {
    it("should generate a valid token", () => {
      const token = qrService.generateToken();
      expect(token).toBeDefined();
      expect(token).toContain(".");
      const [random, signature] = token.split(".");
      expect(random).toBeDefined();
      expect(signature).toBeDefined();
    });

    it("should verify a valid token", () => {
      const token = qrService.generateToken();
      const isValid = qrService.verifyToken(token);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid token", () => {
      const invalidToken = "invalid.token";
      const isValid = qrService.verifyToken(invalidToken);
      expect(isValid).toBe(false);
    });

    it("should reject a malformed token", () => {
      const malformed = "notokenformat";
      const isValid = qrService.verifyToken(malformed);
      expect(isValid).toBe(false);
    });

    it("should reject an empty token", () => {
      const isValid = qrService.verifyToken("");
      expect(isValid).toBe(false);
    });

    it("should generate unique tokens", () => {
      const token1 = qrService.generateToken();
      const token2 = qrService.generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("URL building", () => {
    it("should build a valid validation URL", () => {
      const token = "test.token";
      const url = qrService.buildValidationUrl(token);
      expect(url).toContain("/validar");
      expect(url).toContain(`token=${encodeURIComponent(token)}`);
    });

    it("should encode the token properly", () => {
      const token = "token.with.dots";
      const url = qrService.buildValidationUrl(token);
      expect(url).toContain(encodeURIComponent(token));
    });
  });

  describe("QR Data URL generation", () => {
    it("should generate a QR data URL from a URL", async () => {
      const url = "https://example.com/validar?token=test";
      const dataUrl = await qrService.generateQrDataUrl(url);
      expect(dataUrl).toBeDefined();
      expect(dataUrl).toStartWith("data:image/png;base64");
    });
  });
});
