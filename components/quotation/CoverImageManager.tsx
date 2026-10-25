"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoverImageSettings } from "@/types/quotation";

interface Props {
  value: CoverImageSettings | null;
  onChange: (value: CoverImageSettings | null) => void;
}

export default function CoverImageManager({ value, onChange }: Props) {
  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      onChange({
        name: file.name,
        src: reader.result,
        x: value?.x ?? 15,
        y: value?.y ?? 110,
        width: value?.width ?? 180,
        height: value?.height ?? 100,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This image appears on page 1 between the four customer testimonial quotes, matching the original quotation layout.
      </p>

      {value ? (
        <div className="rounded-lg border p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <img src={value.src} alt={value.name} className="h-32 w-full rounded border object-contain md:w-52" />
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div><Label>X position</Label><Input type="number" value={value.x} onChange={(event) => onChange({ ...value, x: Number(event.target.value) || 0 })} /></div>
              <div><Label>Y position</Label><Input type="number" value={value.y} onChange={(event) => onChange({ ...value, y: Number(event.target.value) || 0 })} /></div>
              <div><Label>Width</Label><Input type="number" value={value.width} onChange={(event) => onChange({ ...value, width: Number(event.target.value) || 0 })} /></div>
              <div><Label>Height</Label><Input type="number" value={value.height} onChange={(event) => onChange({ ...value, height: Number(event.target.value) || 0 })} /></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="truncate text-sm text-muted-foreground">{value.name}</span>
            <Button type="button" variant="outline" onClick={() => onChange(null)}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No bespoke cover image uploaded.</p>
      )}

      <div>
        <input
          id="quotation-cover-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <Button asChild type="button" variant="outline">
          <label htmlFor="quotation-cover-image" className="cursor-pointer"><ImagePlus className="mr-2 h-4 w-4" />{value ? "Replace Image" : "Upload Image"}</label>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">Original defaults: x 15, y 110, width 180, height 100.</p>
    </div>
  );
}
