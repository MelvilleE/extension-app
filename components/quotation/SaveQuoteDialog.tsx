"use client";

import { useEffect, useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuoteFolder } from "@/types/quotation";

interface Props {
  open: boolean;
  customerName: string;
  nextRevision: number;
  folders: QuoteFolder[];
  defaultFolderId?: string;
  onClose: () => void;
  onCreateFolder: (name: string) => QuoteFolder;
  onSave: (options: { revisionName: string; folderId?: string }) => void;
}

export default function SaveQuoteDialog({
  open,
  customerName,
  nextRevision,
  folders,
  defaultFolderId,
  onClose,
  onCreateFolder,
  onSave,
}: Props) {
  const [revisionName, setRevisionName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (!open) return;
    setRevisionName("");
    setFolderId(defaultFolderId ?? "");
    setNewFolderName("");
  }, [open, defaultFolderId]);

  if (!open) return null;

  function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const created = onCreateFolder(name);
    setFolderId(created.id);
    setNewFolderName("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Save Quote</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {customerName || "Untitled client"} · Revision {nextRevision}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="revision-name">Revision / file name (optional)</Label>
            <Input
              id="revision-name"
              value={revisionName}
              onChange={(event) => setRevisionName(event.target.value)}
              placeholder="e.g. Kitchen option B, Final quote, Client changes"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Saved as Rev {nextRevision}{revisionName.trim() ? ` — ${revisionName.trim()}` : ""}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-folder">Folder / property</Label>
            <select
              id="quote-folder"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Unfiled</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <Label htmlFor="new-folder">Create a new folder</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="new-folder"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="e.g. Ted Melville — 10 High Street"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    createFolder();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={createFolder}><FolderPlus className="mr-2 h-4 w-4" />Create</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave({ revisionName: revisionName.trim(), folderId: folderId || undefined })}>
              Save Rev {nextRevision}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
