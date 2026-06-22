"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QRScanner, ValidacionResult } from "@/components/carnets/QRScanner";
import type { ValidacionQrResult } from "@/types/carnet";

function ValidarContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ValidacionQrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      validar(t);
    }
  }, [searchParams]);

  async function validar(t: string) {
    if (!t.trim()) {
      setError("Ingresa un token válido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/validar/${encodeURIComponent(t)}`);
      const json = await res.json();
      setLoading(false);
      if (json.success) {
        setResult(json.data);
        setError("");
      } else {
        setError(json.error || "Error en la validación");
        setResult(null);
      }
    } catch (e) {
      setLoading(false);
      setError("Error de conexión");
      setResult(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#0066CC]">Validación de Carné SENA</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica la autenticidad de un carné escaneando el código QR
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Escaneo QR */}
          <div>
            <h3 className="font-semibold mb-2">Opción 1: Escanear QR</h3>
            <QRScanner
              onResult={(t) => {
                setToken(t);
                validar(t);
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O</span>
            </div>
          </div>

          {/* Ingreso manual */}
          <div>
            <h3 className="font-semibold mb-2">Opción 2: Ingresar token</h3>
            <div className="space-y-2">
              <Label htmlFor="token">Token o código QR</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError("");
                }}
                placeholder="Pega el token aquí..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") validar(token);
                }}
              />
              <Button
                onClick={() => validar(token)}
                disabled={loading || !token.trim()}
                className="w-full bg-[#0066CC]"
              >
                {loading ? "Validando..." : "Validar carné"}
              </Button>
            </div>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Resultado */}
          {result && <ValidacionResult result={result} />}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">ℹ️ Sobre esta validación</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • Este servicio verifica la autenticidad de carnés institucionales del SENA
          </p>
          <p>
            • La validación es pública y puede ser usada por cualquier persona
          </p>
          <p>
            • Solo se muestra información no sensible del carné
          </p>
          <p>
            • Si el carné está vencido, suspendido o revocado, se indicará claramente
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-[#0066CC] hover:underline">
          Iniciar sesión
        </Link>
        {" "}para acceder al sistema completo
      </p>
    </div>
  );
}

export default function ValidarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0066CC]/5 to-background p-4 flex items-center justify-center">
      <Suspense fallback={<p>Cargando...</p>}>
        <ValidarContent />
      </Suspense>
    </div>
  );
}
