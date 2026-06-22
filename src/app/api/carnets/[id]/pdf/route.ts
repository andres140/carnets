import { NextRequest } from "next/server";
import { requirePermission, getClientIp, ApiError } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { carnetService } from "@/services/carnet.service";
import { pdfService } from "@/services/pdf.service";

export const runtime = "nodejs";

function pdfResponse(buffer: Buffer, codigoUnico: string, disposition: "inline" | "attachment") {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="carnet-${codigoUnico}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("carnets.ver");
    const { id } = await params;
    const carnet = await carnetService.getById(id, actor);
    if (!carnet) return apiError(new ApiError("Carne no encontrado", 404));

    const disposition = request.nextUrl.searchParams.get("preview") === "1" ? "inline" : "attachment";
    const { buffer } = await pdfService.generateForCarnet({
      carnet,
      actor,
      action: disposition === "inline" ? "GENERAR_PDF" : "DESCARGAR_PDF",
      ip: getClientIp(request),
    });

    return pdfResponse(buffer, carnet.codigoUnico, disposition);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("carnets.generar");
    const { id } = await params;
    const carnet = await carnetService.getById(id, actor);
    if (!carnet) return apiError(new ApiError("Carne no encontrado", 404));

    const { buffer } = await pdfService.generateForCarnet({
      carnet,
      actor,
      action: "REIMPRIMIR_PDF",
      ip: getClientIp(request),
    });

    return pdfResponse(buffer, carnet.codigoUnico, "attachment");
  } catch (e) {
    return apiError(e);
  }
}
