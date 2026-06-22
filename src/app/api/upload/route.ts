import { NextRequest } from "next/server";
import { requirePermission, ApiError } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { storageService } from "@/services/storage.service";

export async function POST(request: NextRequest) {
  try {
    await requirePermission("usuarios.editar");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError(new ApiError("Archivo requerido", 400));

    const subfolder = (formData.get("subfolder") as string) ?? "fotos";
    const url = await storageService.saveImage(file, subfolder);
    return apiSuccess({ url });
  } catch (e) {
    return apiError(e);
  }
}
