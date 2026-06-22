"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function PhotoUpload({
  value,
  onChange,
  disabled,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subfolder", "fotos");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (json.success && json.data?.url) {
      onChange(json.data.url);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">Sin foto</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Subir foto
      </Button>
    </div>
  );
}
