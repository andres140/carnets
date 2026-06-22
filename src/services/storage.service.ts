import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "@/lib/constants";

export const storageService = {
  async saveImage(file: File, subfolder: string): Promise<string> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Tipo de archivo no permitido. Use JPEG, PNG o WebP.");
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error("El archivo excede el tamaño máximo de 5MB.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${randomBytes(16).toString("hex")}.${ext}`;

    const uploadDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      process.env.UPLOAD_DIR ?? "public/uploads",
      subfolder
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return `/uploads/${subfolder}/${filename}`;
  },
};
