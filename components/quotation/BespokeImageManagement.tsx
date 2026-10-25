"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoverImageSettings } from "@/types/quotation";

interface Props {
  images: CoverImageSettings[];
  onChange: (images: CoverImageSettings[]) => void;
}

export default function BespokeImageManagement({ images, onChange }: Props) {
  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result || typeof event.target.result !== "string") return;
        const newImage: CoverImageSettings = {
          id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          src: event.target.result,
          x: 15,
          y: 110,
          width: 180,
          height: 100,
        };
        onChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  }

  function updateImage(index: number, patch: Partial<CoverImageSettings>) {
    onChange(images.map((image, imageIndex) => imageIndex === index ? { ...image, ...patch } : image));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Bespoke Image Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {images.map((image, index) => (
            <div key={image.id ?? `${image.name}-${index}`} className="flex items-center gap-4 rounded-lg border p-3">
              <img src={image.src} alt={image.name} className="h-12 w-12 object-contain" />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`image-x-${index}`}>X Position</Label>
                  <Input id={`image-x-${index}`} type="number" min="0" max="210" value={image.x} onChange={(event) => updateImage(index, { x: Number(event.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor={`image-y-${index}`}>Y Position</Label>
                  <Input id={`image-y-${index}`} type="number" min="0" max="297" value={image.y} onChange={(event) => updateImage(index, { y: Number(event.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor={`image-width-${index}`}>Width</Label>
                  <Input id={`image-width-${index}`} type="number" min="5" max="210" value={image.width} onChange={(event) => updateImage(index, { width: Number(event.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor={`image-height-${index}`}>Height</Label>
                  <Input id={`image-height-${index}`} type="number" min="5" max="297" value={image.height} onChange={(event) => updateImage(index, { height: Number(event.target.value) || 0 })} />
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => removeImage(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Upload Images
            <input type="file" className="hidden" accept="image/*" multiple onChange={(event) => handleImageUpload(event.target.files)} />
          </label>
        </div>

        {images.length > 0 && (
          <p className="text-sm text-muted-foreground">Image: xPos = 15, yPos = 110, Width = 180, Height = 100.</p>
        )}
      </CardContent>
    </Card>
  );
}
