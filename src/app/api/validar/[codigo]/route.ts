import { NextRequest } from "next/server";
import { getApiSession, getClientIp } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { carnetService } from "@/services/carnet.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const session = await getApiSession();
    const result = await carnetService.validarQr(
      codigo,
      getClientIp(request),
      session?.id
    );
    return apiSuccess(result);
  } catch (e) {
    return apiError(e);
  }
}
