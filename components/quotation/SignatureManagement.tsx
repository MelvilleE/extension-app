"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignatureSettings } from "@/types/quotation";

interface SignatureManagementProps {
  value: SignatureSettings;
  onChange: (value: SignatureSettings) => void;
}

export default function SignatureManagement({ value, onChange }: SignatureManagementProps) {
  function uploadImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      onChange({ ...value, imageName: file.name, imageSrc: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        These details are shared by Loft and Extension and are used in the quotation signature block. They can also be reused by the email system later.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={value.signatoryName} onChange={(event) => onChange({ ...value, signatoryName: event.target.value })} />
        </div>
        <div>
          <Label>Job title</Label>
          <Input value={value.signatoryTitle} onChange={(event) => onChange({ ...value, signatoryTitle: event.target.value })} />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={value.companyName} onChange={(event) => onChange({ ...value, companyName: event.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Email</Label>
          <Input type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <Label>Signature image</Label>
        {value.imageSrc ? (
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <img src={value.imageSrc} alt={value.imageName || "Signature"} className="h-28 w-full rounded border object-contain md:w-64" />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div>
                  <Label>Width</Label>
                  <Input type="number" min="10" max="180" value={value.imageWidth} onChange={(event) => onChange({ ...value, imageWidth: Number(event.target.value) || 75 })} />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input type="number" min="5" max="100" value={value.imageHeight} onChange={(event) => onChange({ ...value, imageHeight: Number(event.target.value) || 30 })} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="truncate text-sm text-muted-foreground">{value.imageName || "Signature image"}</span>
              <Button type="button" variant="destructive" size="sm" onClick={() => onChange({ ...value, imageName: undefined, imageSrc: undefined })}>
                <Trash2 className="mr-2 h-4 w-4" />Remove
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No custom signature image uploaded. The existing default signature will continue to be used until one is added.</p>
        )}

        <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <ImagePlus className="mr-2 h-4 w-4" />
          {value.imageSrc ? "Replace Signature Image" : "Upload Signature Image"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadImage(event.target.files?.[0] ?? null)} />
        </label>
      </div>
    </div>
  );
}
