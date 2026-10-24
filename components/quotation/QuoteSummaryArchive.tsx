"use client";

import { Download, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateItemTotal, gbpFormatter, type QuoteTotals } from "@/lib/quotation/calculations";
import type { FinancialSettings, Product, QuotationFormData, SavedQuote } from "@/types/quotation";
import type { QuoteSort } from "@/lib/quotation/search";

interface Props {
  label: string;
  formData: QuotationFormData;
  products: Product[];
  financials: FinancialSettings;
  totals: QuoteTotals;
  quotes: SavedQuote[];
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
  onDeleteQuote: (id: string) => void;
  onCustomerPdf: () => void;
  onInternalWorkings: () => void;
  onClientWorkings: () => void;
  onSaveQuote: () => void;
}

export default function QuoteSummaryArchive(props: Props) {
  const { totals, financials, formData, products } = props;

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
          <h3 className="mb-4 text-lg font-medium">Saved Quotes</h3>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_145px_145px_175px]">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search client, address or revision…" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} /></div>
            <Input type="date" value={props.fromDate} onChange={(event) => props.onFromDateChange(event.target.value)} />
            <Input type="date" value={props.toDate} onChange={(event) => props.onToDateChange(event.target.value)} />
            <Select value={props.sort} onValueChange={(value) => props.onSortChange(value as QuoteSort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updated-desc">Recently updated</SelectItem><SelectItem value="created-desc">Newest</SelectItem><SelectItem value="created-asc">Oldest</SelectItem><SelectItem value="name-asc">Customer A-Z</SelectItem></SelectContent></Select>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {props.quotes.length === 0 && <p className="text-sm text-muted-foreground">No matching saved quotes.</p>}
            {props.quotes.map((quote) => (
              <div key={quote.id} className={`rounded-lg border p-4 ${props.activeQuote?.id === quote.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <button className="flex-1 cursor-pointer text-left" onClick={() => props.onLoadQuote(quote)}>
                    <h4 className="font-medium">{quote.customerName} — Rev {quote.revision}</h4>
                    <p className="text-sm text-gray-600">Updated: {new Date(quote.updatedAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-gray-500">{quote.formData.address || "No address"} · {quote.formData.items.length} items</p>
                  </button>
                  <Button size="icon" variant="outline" onClick={() => props.onDeleteQuote(quote.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
