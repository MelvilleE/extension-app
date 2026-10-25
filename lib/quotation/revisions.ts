import type { QuotationFormData, SavedQuote } from "@/types/quotation";

export function getNextRevision(quotes: SavedQuote[], quoteGroupId: string) {
  const highest = quotes
    .filter((quote) => quote.quoteGroupId === quoteGroupId)
    .reduce((max, quote) => Math.max(max, quote.revision || 0), 0);
  return highest + 1;
}

function normaliseIdentityValue(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * A saved quote belongs to one client/property family. If either the client
 * name or property address changes after loading a saved revision, saving
 * must start a fresh family at Revision 1 rather than continuing the source
 * quote's revision history.
 */
export function hasQuoteIdentityChanged(source: SavedQuote, current: QuotationFormData) {
  const sourceName = normaliseIdentityValue(source.customerName || source.formData.name);
  const currentName = normaliseIdentityValue(current.name);
  const sourceAddress = normaliseIdentityValue(source.formData.address);
  const currentAddress = normaliseIdentityValue(current.address);

  return sourceName !== currentName || sourceAddress !== currentAddress;
}

export function buildSavedQuoteTitle(customerName: string, revision: number, revisionName?: string) {
  const cleanName = revisionName?.trim();
  return `${customerName} - Rev ${revision}${cleanName ? ` - ${cleanName}` : ""}`;
}
