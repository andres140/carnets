import { NextResponse } from "next/server";
import { ApiError } from "./api-auth";

export function apiSuccess<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  console.error(error);
  return NextResponse.json(
    { success: false, error: "Error interno del servidor" },
    { status: 500 }
  );
}
