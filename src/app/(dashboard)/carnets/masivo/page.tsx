"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CSV_EXAMPLE = `documento,nombreCompleto,tipoUsuario,email,centroCodigo,fechaVencimiento
1234567890,Juan Pérez,APRENDIZ,juan@sena.edu.co,CTR001,2027-06-16
9876543210,Maria López,INSTRUCTOR,maria@sena.edu.co,CTR001,2027-06-16`;

export default function CarnetMasivoPage() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  function parseCsv(text: string) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
  }

  async function handleSubmit() {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast.error("CSV vacío o inválido");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/carnets/masivo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setResult(json.data);
      toast.success(`Procesado: ${json.data.exitos} éxitos, ${json.data.errores} errores`);
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Generación masiva de carnés</h1>
      <Card>
        <CardHeader>
          <CardTitle>Importar CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Formato CSV (con encabezados)</Label>
            <Textarea
              rows={12}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={CSV_EXAMPLE}
            />
          </div>
          <Button variant="outline" onClick={() => setCsvText(CSV_EXAMPLE)}>
            Usar ejemplo
          </Button>
          <Button className="bg-[#0066CC]" onClick={handleSubmit} disabled={loading}>
            {loading ? "Procesando..." : "Importar y generar"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent>
            <p>Éxitos: {result.exitos as number}</p>
            <p>Errores: {result.errores as number}</p>
            {(result.detalles as string[])?.length > 0 && (
              <ul className="mt-2 text-sm text-red-600">
                {(result.detalles as string[]).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
