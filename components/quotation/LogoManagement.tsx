"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoverImageSettings } from "@/types/quotation";

interface Props {
  logos: CoverImageSettings[];
  onChange: (logos: CoverImageSettings[]) => void;
}

export default function LogoManagement({ logos, onChange }: Props) {
  function upload(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        onChange([
          ...logos,
          {
            id: `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src: reader.result,
            x: 15,
            y: 15,
            width: 60,
            height: 30,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function updateLogo(index: number, patch: Partial<CoverImageSettings>) {
    onChange(logos.map((logo, logoIndex) => logoIndex === index ? { ...logo, ...patch } : logo));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {logos.map((logo, index) => (
          <div key={logo.id ?? `${logo.name}-${index}`} className="flex items-center gap-4 rounded-lg border p-3">
            <img src={logo.src} alt={logo.name} className="h-12 w-12 object-contain" />
            <div className="grid flex-1 grid-cols-2 gap-2">
              <div><Label>X Position</Label><Input type="number" min="0" max="210" value={logo.x} onChange={(event) => updateLogo(index, { x: Number(event.target.value) || 0 })} /></div>
              <div><Label>Y Position</Label><Input type="number" min="0" max="297" value={logo.y} onChange={(event) => updateLogo(index, { y: Number(event.target.value) || 0 })} /></div>
              <div><Label>Width</Label><Input type="number" min="5" max="210" value={logo.width} onChange={(event) => updateLogo(index, { width: Number(event.target.value) || 0 })} /></div>
              <div><Label>Height</Label><Input type="number" min="5" max="297" value={logo.height} onChange={(event) => updateLogo(index, { height: Number(event.target.value) || 0 })} /></div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => onChange(logos.filter((_, logoIndex) => logoIndex !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Upload Logos
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => upload(event.target.files)} />
        </label>
      </div>

      {logos.length > 0 && <p className="text-sm text-muted-foreground">NLLR Logo: xPos = 15, yPos = 15, Width = 60, Height = 30.</p>}
    </div>
  );
}
