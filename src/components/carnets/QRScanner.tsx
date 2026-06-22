"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function QRScanner({
  onResult,
}: {
  onResult: (token: string) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader";

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScan() {
    setScanning(true);
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        const token = extractToken(decoded);
        if (token) {
          scanner.stop().catch(() => {});
          setScanning(false);
          onResult(token);
        }
      },
      () => {}
    );
  }

  async function stopScan() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  }

  function extractToken(urlOrToken: string): string | null {
    try {
      if (urlOrToken.includes("token=")) {
        const url = new URL(urlOrToken);
        return url.searchParams.get("token");
      }
      if (urlOrToken.includes(".")) return urlOrToken;
      return urlOrToken;
    } catch {
      return urlOrToken;
    }
  }

  return (
    <div className="space-y-4">
      <div id={elementId} className="max-w-sm mx-auto" />
      <div className="flex gap-2 justify-center">
        {!scanning ? (
          <Button onClick={startScan}>Iniciar escaneo</Button>
        ) : (
          <Button variant="outline" onClick={stopScan}>Detener</Button>
        )}
      </div>
    </div>
  );
}

export function ValidacionResult({
  result,
}: {
  result: {
    valido: boolean;
    estado: string | null;
    carnet: {
      codigoUnico: string;
      nombreCompleto: string;
      documento: string;
      tipoUsuario: string;
      centroNombre: string | null;
      regionalNombre: string | null;
      fotoUrl: string | null;
      fechaExpedicion: Date | string;
      fechaVencimiento: Date | string;
    } | null;
    mensaje: string;
  } | null;
}) {
  if (!result) return null;

  const carnet = result.carnet;
  const fechaExp = carnet?.fechaExpedicion
    ? new Date(carnet.fechaExpedicion).toLocaleDateString("es-CO")
    : null;
  const fechaVenc = carnet?.fechaVencimiento
    ? new Date(carnet.fechaVencimiento).toLocaleDateString("es-CO")
    : null;

  return (
    <Card className={result.valido ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.valido ? "✓ Válido" : "✗ No válido"}
          {result.estado && <StatusBadge status={result.estado} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{result.mensaje}</p>

        {carnet && (
          <div className="space-y-3 bg-white p-3 rounded border">
            {carnet.fotoUrl && (
              <img
                src={carnet.fotoUrl}
                alt="Foto del carné"
                className="w-24 h-32 object-cover rounded"
              />
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="font-semibold">{carnet.nombreCompleto}</p>
              </div>
              <div>
                <span className="text-gray-600">Documento:</span>
                <p className="font-mono">{carnet.documento}</p>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <p>{carnet.tipoUsuario}</p>
              </div>
              <div>
                <span className="text-gray-600">Código:</span>
                <p className="font-mono text-xs">{carnet.codigoUnico}</p>
              </div>
              {carnet.centroNombre && (
                <div className="col-span-2">
                  <span className="text-gray-600">Centro:</span>
                  <p>{carnet.centroNombre}</p>
                </div>
              )}
              {carnet.regionalNombre && (
                <div className="col-span-2">
                  <span className="text-gray-600">Regional:</span>
                  <p>{carnet.regionalNombre}</p>
                </div>
              )}
              {fechaExp && (
                <div>
                  <span className="text-gray-600">Expedición:</span>
                  <p>{fechaExp}</p>
                </div>
              )}
              {fechaVenc && (
                <div>
                  <span className="text-gray-600">Vencimiento:</span>
                  <p>{fechaVenc}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
