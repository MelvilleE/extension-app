"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importLegacyExport, type LegacyLocalStorageExport } from "@/lib/quotation/storage";
import type { QuoteType } from "@/types/quotation";

export default function DataMigrationPanel() {
  const [type, setType] = useState<QuoteType>("extension");
  const [message, setMessage] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as LegacyLocalStorageExport;
      const result = importLegacyExport(type, parsed);
      setMessage(
        `Imported ${result.sections} sections, ${result.products} products and ${result.quotes} saved quotes into ${type}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage("Import failed. Please select a JSON export created by the existing quotation app.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Existing Quotation Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Export data from each existing app first. Import the Extension export as Extension and the Loft export as Loft. The unified system keeps the two catalogues and quote histories separate.
        </p>
        <div className="space-y-2">
          <Label>Data belongs to</Label>
          <Select value={type} onValueChange={(value) => setType(value as QuoteType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extension">Extension</SelectItem>
              <SelectItem value="loft">Loft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <input
            id="legacy-import-file"
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
          <Button asChild>
            <label htmlFor="legacy-import-file" className="cursor-pointer">Choose Export File</label>
          </Button>
        </div>
        {message && <p className="text-sm font-medium">{message}</p>}
      </CardContent>
    </Card>
  );
}
