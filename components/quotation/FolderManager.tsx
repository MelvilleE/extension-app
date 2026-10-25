"use client";

import { useEffect, useMemo, useState } from "react";
import { Folder, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadFolders, loadQuotes, saveFolders } from "@/lib/quotation/storage";
import type { QuoteFolder } from "@/types/quotation";

export const FOLDERS_CHANGED_EVENT = "quotation-folders-changed";

export default function FolderManager() {
  const [folders, setFolders] = useState<QuoteFolder[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setFolders(loadFolders());
  }, []);

  const counts = useMemo(() => {
    const quotes = [...loadQuotes("extension"), ...loadQuotes("loft")];
    return new Map(
      folders.map((folder) => [folder.id, quotes.filter((quote) => quote.folderId === folder.id).length]),
    );
  }, [folders]);

  function createFolder() {
    const cleanName = name.trim();
    if (!cleanName) return;

    const existing = folders.find((folder) => folder.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      setName("");
      return;
    }

    const now = new Date().toISOString();
    const folder: QuoteFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      createdAt: now,
      updatedAt: now,
    };

    const next = [...folders, folder];
    setFolders(next);
    saveFolders(next);
    setName("");
    window.dispatchEvent(new CustomEvent(FOLDERS_CHANGED_EVENT));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client / Property Folders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Ted Melville — 10 High Street"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createFolder();
              }
            }}
          />
          <Button onClick={createFolder} disabled={!name.trim()}>
            <FolderPlus className="mr-2 h-4 w-4" />Create Folder
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Folders can be created before any quote exists. Use them to organise existing Unfiled quotes or future revisions by client/property.
        </p>

        {folders.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm font-medium">{folder.name}</span>
                </div>
                <span className="ml-2 text-xs text-muted-foreground">{counts.get(folder.id) ?? 0} quotes</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
