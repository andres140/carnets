"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DevCredentialsCard() {
  // Only show in development environment
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base text-amber-900">
            Solo visible en modo desarrollo
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-white rounded p-3 border border-amber-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            USUARIO DE PRUEBA
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Correo: </span>
              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                admin@sena.edu.co
              </code>
            </div>
            <div>
              <span className="text-gray-600">Contraseña: </span>
              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                Admin123!
              </code>
            </div>
            <div>
              <span className="text-gray-600">Rol: </span>
              <span className="font-semibold text-gray-900">Administrador</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-amber-700">
          ⚠️ Estas credenciales se desactivan automáticamente en producción
          mediante la variable de entorno NODE_ENV.
        </p>
      </CardContent>
    </Card>
  );
}
