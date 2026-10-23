import type { SavedQuote } from "@/types/quotation";

export type QuoteSort = "updated-desc" | "created-desc" | "created-asc" | "name-asc";

interface QuoteSearchOptions {
  query?: string;
  fromDate?: string;
  toDate?: string;
  sort?: QuoteSort;
}

export function filterAndSortQuotes(quotes: SavedQuote[], options: QuoteSearchOptions = {}) {
  const query = options.query?.trim().toLowerCase() ?? "";
  const from = options.fromDate ? new Date(`${options.fromDate}T00:00:00`).getTime() : null;
  const to = options.toDate ? new Date(`${options.toDate}T23:59:59.999`).getTime() : null;

  const filtered = quotes.filter((quote) => {
    const created = new Date(quote.createdAt).getTime();
    if (from !== null && created < from) return false;
    if (to !== null && created > to) return false;

    if (!query) return true;

    const haystack = [
      quote.customerName,
      quote.title,
      quote.formData.address,
      quote.quoteType,
      `rev ${quote.revision}`,
      String(quote.revision),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  const sort = options.sort ?? "updated-desc";
  return [...filtered].sort((a, b) => {
    if (sort === "created-desc") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (sort === "created-asc") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (sort === "name-asc") return a.customerName.localeCompare(b.customerName);
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}
