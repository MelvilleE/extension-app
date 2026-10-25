"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Folder, Save, Search, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateItemTotal, gbpFormatter, type QuoteTotals } from "@/lib/quotation/calculations";
import type { FinancialSettings, Product, QuoteFolder, QuotationFormData, SavedQuote } from "@/types/quotation";
import type { QuoteSort } from "@/lib/quotation/search";

interface Props {
  label: string;
  formData: QuotationFormData;
  products: Product[];
  financials: FinancialSettings;
  totals: QuoteTotals;
  quotes: SavedQuote[];
  folders: QuoteFolder[];
  activeQuote: SavedQuote | null;
  search: string;
  fromDate: string;
  toDate: string;
  sort: QuoteSort;
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onSortChange: (value: QuoteSort) => void;
  onLoadQuote: (quote: SavedQuote) => void;
  onUseAsTemplate: (quote: SavedQuote) => void;
  onMoveQuoteToFolder: (id: string, folderId?: string) => void;
  onDeleteQuote: (id: string) => void;
  onCustomerPdf: () => void;
  onInternalWorkings: () => void;
  onClientWorkings: () => void;
  onSaveQuote: () => void;
}

export default function QuoteSummaryArchive(props: Props) {
  const { totals, financials, formData, products } = props;
  const [folderFilter, setFolderFilter] = useState("all");

  const folderGroups = useMemo(() => {
    const visible = folderFilter === "all"
      ? props.quotes
      : props.quotes.filter((quote) => (quote.folderId ?? "unfiled") === folderFilter);

    const groups: Array<{ id: string; name: string; quotes: SavedQuote[] }> = [];
    for (const folder of props.folders) {
      const quotes = visible.filter((quote) => quote.folderId === folder.id);
      if (quotes.length) groups.push({ id: folder.id, name: folder.name, quotes });
    }
    const unfiled = visible.filter((quote) => !quote.folderId);
    if (unfiled.length) groups.push({ id: "unfiled", name: "Unfiled", quotes: unfiled });
    return groups;
  }, [props.quotes, props.folders, folderFilter]);

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <div className="mb-4 space-y-2">
          <div className="flex justify-between"><span>Products Total:</span><span>{gbpFormatter.format(totals.productsTotal)}</span></div>
          <div className="flex justify-between"><span>VAT on Products ({financials.vatRate}%):</span><span>{gbpFormatter.format(totals.productsVat)}</span></div>
          <div className="flex justify-between font-medium"><span>Products + VAT:</span><span>{gbpFormatter.format(totals.productsTotalWithVat)}</span></div>
          <div className="mt-2 flex justify-between"><span>Commission A ({financials.commissionA}%):</span><span>{gbpFormatter.format(totals.commissionA)}</span></div>
          <div className="flex justify-between"><span>Commission B ({financials.commissionB}%):</span><span>{gbpFormatter.format(totals.commissionB)}</span></div>
          <div className="flex justify-between"><span>Commission C ({financials.commissionC}%):</span><span>{gbpFormatter.format(totals.commissionC)}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-medium"><span>Total Commission:</span><span>{gbpFormatter.format(totals.totalCommission)}</span></div>
          <div className="flex justify-between"><span>VAT on Commission:</span><span>{gbpFormatter.format(totals.commissionVat)}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total Cost (Products + Commission):</span><span>{gbpFormatter.format(totals.totalCost)}</span></div>
          <div className="flex justify-between font-bold"><span>Total VAT:</span><span>{gbpFormatter.format(totals.totalVat)}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold"><span>Grand Total:</span><span>{gbpFormatter.format(totals.grandTotal)}</span></div>
        </div>

        <div className="my-6 space-y-2">
          {formData.items.map((item) => {
            const product = products.find((candidate) => candidate.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.id} className="border-b pb-2">
                <div className="flex justify-between gap-4">
                  <span>
                    {product.name} — {product.valueType === "unit" ? "Quantity" : product.valueType === "meter" ? "Length" : "Area"}: {item.value}{product.valueType === "meter" ? "m" : product.valueType === "meterage" ? "m²" : ""}
                    {product.valueType !== "unit" ? ` — Quantity: ${item.quantity}` : ""}
                  </span>
                  <span>{gbpFormatter.format(calculateItemTotal(item, products))}</span>
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={props.onCustomerPdf} className="flex-1"><Download className="mr-2 h-4 w-4" />Generate {props.label} PDF</Button>
          <Button variant="secondary" onClick={props.onInternalWorkings} className="flex-1"><Download className="mr-2 h-4 w-4" />Internal Workings</Button>
          <Button variant="secondary" onClick={props.onClientWorkings} className="flex-1"><Download className="mr-2 h-4 w-4" />Client Workings</Button>
          <Button variant="outline" onClick={props.onSaveQuote} className="flex-1"><Save className="mr-2 h-4 w-4" />Save Quote</Button>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium">Saved Quotes</h3>
            <span className="text-sm text-muted-foreground">Organised by client / property folder</span>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_145px_145px_175px]">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search client, address or revision name…" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} /></div>
            <Input type="date" value={props.fromDate} onChange={(event) => props.onFromDateChange(event.target.value)} />
            <Input type="date" value={props.toDate} onChange={(event) => props.onToDateChange(event.target.value)} />
            <Select value={props.sort} onValueChange={(value) => props.onSortChange(value as QuoteSort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updated-desc">Recently updated</SelectItem><SelectItem value="created-desc">Newest</SelectItem><SelectItem value="created-asc">Oldest</SelectItem><SelectItem value="name-asc">Customer A-Z</SelectItem></SelectContent></Select>
          </div>

          <div className="mb-4 max-w-sm">
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger><SelectValue placeholder="All folders" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All folders</SelectItem>
                {props.folders.map((folder) => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}
                <SelectItem value="unfiled">Unfiled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {folderGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching saved quotes.</p>
          ) : (
            <Accordion type="multiple" className="space-y-3" defaultValue={folderGroups.map((group) => group.id)}>
              {folderGroups.map((group) => (
                <AccordionItem key={group.id} value={group.id} className="rounded-lg border bg-white px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2"><Folder className="h-4 w-4" />{group.name}<span className="text-xs font-normal text-muted-foreground">({group.quotes.length})</span></span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {group.quotes.map((quote) => (
                        <div key={quote.id} className={`rounded-lg border p-4 ${props.activeQuote?.id === quote.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <button className="flex-1 cursor-pointer text-left" onClick={() => props.onLoadQuote(quote)}>
                              <h4 className="font-medium">{quote.title || `${quote.customerName} — Rev ${quote.revision}`}</h4>
                              <p className="text-sm text-gray-600">Updated: {new Date(quote.updatedAt).toLocaleString()}</p>
                              <p className="mt-1 text-sm text-gray-500">{quote.formData.address || "No address"} · {quote.formData.items.length} items</p>
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => props.onUseAsTemplate(quote)}><Copy className="mr-2 h-4 w-4" />Use as template</Button>
                              <select
                                aria-label="Move quote to folder"
                                value={quote.folderId ?? ""}
                                onChange={(event) => props.onMoveQuoteToFolder(quote.id, event.target.value || undefined)}
                                className="h-9 max-w-[190px] rounded-md border border-input bg-background px-2 text-sm"
                              >
                                <option value="">Unfiled</option>
                                {props.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                              </select>
                              <Button size="icon" variant="outline" onClick={() => props.onDeleteQuote(quote.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
