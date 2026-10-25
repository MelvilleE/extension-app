"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Folder, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterAndSortQuotes, type QuoteSort } from "@/lib/quotation/search";
import { loadFolders, loadQuotes, saveQuotes } from "@/lib/quotation/storage";
import type { QuoteFolder, QuoteType, SavedQuote } from "@/types/quotation";

const FOLDERS_CHANGED_EVENT = "quotation-folders-changed";

export default function CombinedSavedQuotes() {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [folders, setFolders] = useState<QuoteFolder[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<QuoteSort>("updated-desc");
  const [folderId, setFolderId] = useState("all");

  function refresh() {
    setQuotes([...loadQuotes("extension"), ...loadQuotes("loft")]);
    setFolders(loadFolders());
  }

  useEffect(() => {
    refresh();
    window.addEventListener(FOLDERS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(FOLDERS_CHANGED_EVENT, refresh);
  }, []);

  const results = useMemo(() => {
    const searched = filterAndSortQuotes(quotes, { query, sort });
    if (folderId === "all") return searched;
    if (folderId === "unfiled") return searched.filter((quote) => !quote.folderId);
    return searched.filter((quote) => quote.folderId === folderId);
  }, [quotes, query, sort, folderId]);

  function folderName(id?: string) {
    if (!id) return "Unfiled";
    return folders.find((folder) => folder.id === id)?.name ?? "Unknown folder";
  }

  function moveQuoteToFolder(quote: SavedQuote, nextFolderId?: string) {
    const type: QuoteType = quote.quoteType;
    const typeQuotes = loadQuotes(type);
    const now = new Date().toISOString();
    const updated = typeQuotes.map((candidate) =>
      candidate.id === quote.id
        ? { ...candidate, folderId: nextFolderId, updatedAt: now }
        : candidate,
    );
    saveQuotes(type, updated);
    refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Search All Saved Quotes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Customer, address, revision name…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger><SelectValue placeholder="All folders" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {folders.map((folder) => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}
              <SelectItem value="unfiled">Unfiled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as QuoteSort)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated-desc">Recently updated</SelectItem>
              <SelectItem value="created-desc">Newest</SelectItem>
              <SelectItem value="created-asc">Oldest</SelectItem>
              <SelectItem value="name-asc">Customer A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {results.length === 0 && <p className="text-sm text-muted-foreground">No saved quotes found yet.</p>}
          {results.map((quote) => (
            <div key={quote.id} className="rounded-lg border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/unified/${quote.quoteType}`}
                  className="min-w-0 flex-1 rounded-md transition-colors hover:bg-muted/50"
                >
                  <div className="font-medium">{quote.title || `${quote.customerName} — Rev ${quote.revision}`}</div>
                  <div className="text-sm text-muted-foreground">{quote.formData.address || "No address"}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Folder className="h-3 w-3" />{folderName(quote.folderId)}</div>
                </Link>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="text-sm sm:text-right">
                    <div className="font-medium capitalize">{quote.quoteType}</div>
                    <div className="text-muted-foreground">{new Date(quote.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <select
                    aria-label={`Move ${quote.title || quote.customerName} to folder`}
                    value={quote.folderId ?? ""}
                    onChange={(event) => moveQuoteToFolder(quote, event.target.value || undefined)}
                    className="h-9 max-w-[240px] rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Unfiled</option>
                    {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
