import type { SavedQuote } from "@/types/quotation";

export function getNextRevision(quotes: SavedQuote[], quoteGroupId: string) {
  const highest = quotes
    .filter((quote) => quote.quoteGroupId === quoteGroupId)
    .reduce((max, quote) => Math.max(max, quote.revision || 0), 0);
  return highest + 1;
}

export function buildSavedQuoteTitle(customerName: string, revision: number, revisionName?: string) {
  const cleanName = revisionName?.trim();
  return `${customerName} - Rev ${revision}${cleanName ? ` - ${cleanName}` : ""}`;
}
