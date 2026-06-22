import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { reporteService } from "@/services/reporte.service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requirePermission("reportes.ver");
    const { searchParams } = request.nextUrl;

    if (searchParams.get("format") === "csv") {
      const csv = await reporteService.exportCarnetsCsv(actor);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=reporte-carnets.csv",
        },
      });
    }

    const resumen = await reporteService.getResumen(actor);
    return apiSuccess(resumen);
  } catch (e) {
    return apiError(e);
  }
}
