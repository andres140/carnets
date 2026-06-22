import { createHmac, randomBytes } from "crypto";

const QR_KEY = process.env.QR_SIGNING_KEY ?? "dev-qr-key";

export const qrService = {
  generateToken(): string {
    const random = randomBytes(16).toString("hex");
    const signature = createHmac("sha256", QR_KEY)
      .update(random)
      .digest("hex")
      .slice(0, 16);
    return `${random}.${signature}`;
  },

  verifyToken(token: string): boolean {
    const [random, signature] = token.split(".");
    if (!random || !signature) return false;
    const expected = createHmac("sha256", QR_KEY)
      .update(random)
      .digest("hex")
      .slice(0, 16);
    return expected === signature;
  },

  buildValidationUrl(token: string): string {
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return `${base}/validar?token=${encodeURIComponent(token)}`;
  },

  async generateQrDataUrl(url: string): Promise<string> {
    const QRCode = await import("qrcode");
    return QRCode.toDataURL(url, { width: 200, margin: 1 });
  },
};
