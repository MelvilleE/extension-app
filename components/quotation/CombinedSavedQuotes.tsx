"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterAndSortQuotes, type QuoteSort } from "@/lib/quotation/search";
import { loadQuotes } from "@/lib/quotation/storage";
import type { SavedQuote } from "@/types/quotation";

export default function CombinedSavedQuotes() {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<QuoteSort>("updated-desc");

  useEffect(() => {
    setQuotes([...loadQuotes("extension"), ...loadQuotes("loft")]);
  }, []);

  const results = useMemo(
    () => filterAndSortQuotes(quotes, { query, sort }),
    [quotes, query, sort],
  );

  return (
    <Card>
      <CardHeader><CardTitle>Search All Saved Quotes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Customer, address, Loft, Extension, Rev 2…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
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
            <Link
              key={quote.id}
              href={`/unified/${quote.quoteType}`}
              className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{quote.customerName} — Rev {quote.revision}</div>
                  <div className="text-sm text-muted-foreground">{quote.formData.address || "No address"}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium capitalize">{quote.quoteType}</div>
                  <div className="text-muted-foreground">{new Date(quote.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
