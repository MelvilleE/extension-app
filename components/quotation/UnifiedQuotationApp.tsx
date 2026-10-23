"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { defaultProducts, defaultSections } from "@/config/default-catalog";
import { companySettings } from "@/config/company";
import { getQuoteTypeConfig } from "@/config/quote-types";
import { generateQuotationPdf } from "@/lib/pdf/quotationPdf";
import { generateWorkingDetailsPdf } from "@/lib/pdf/workingDetailsPdf";
import { calculateItemTotal, calculateQuoteTotals, gbpFormatter } from "@/lib/quotation/calculations";
import { filterAndSortQuotes, type QuoteSort } from "@/lib/quotation/search";
import {
  loadFinancialSettings,
  loadProducts,
  loadQuotes,
  loadSections,
  loadTextSettings,
  saveQuotes,
} from "@/lib/quotation/storage";
import type {
  FinancialSettings,
  Product,
  QuoteTextSettings,
  QuoteType,
  QuotationFormData,
  SavedQuote,
  Section,
} from "@/types/quotation";

const defaultFinancials: FinancialSettings = {
  vatRate: 20,
  commissionA: 0.5,
  commissionB: 1,
  commissionC: 2.5,
};

async function assetToDataUrl(path: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function UnifiedQuotationApp({ type }: { type: QuoteType }) {
  const config = getQuoteTypeConfig(type);
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [activeQuote, setActiveQuote] = useState<SavedQuote | null>(null);
  const [formData, setFormData] = useState<QuotationFormData>({ name: "", address: "", items: [] });
  const [financials, setFinancials] = useState<FinancialSettings>(defaultFinancials);
  const [text, setText] = useState<QuoteTextSettings>({
    briefText: config.defaultBrief,
    pricingText: config.defaultPricingText,
    termsAndConditions: "",
  });
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<QuoteSort>("updated-desc");
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [catalogueMigrated, setCatalogueMigrated] = useState(false);
  const [textMigrated, setTextMigrated] = useState(false);

  useEffect(() => {
    const storedSections = loadSections(type);
    const storedProducts = loadProducts(type);
    const storedQuotes = loadQuotes(type);
    const storedFinancials = loadFinancialSettings(type);
    const storedText = loadTextSettings(type);

    if (storedSections?.length) setSections(storedSections);
    if (storedProducts?.length) setProducts(storedProducts);
    setCatalogueMigrated(Boolean(storedSections?.length || storedProducts?.length));
    setQuotes(storedQuotes);
    if (storedFinancials) setFinancials(storedFinancials);
    if (storedText) {
      setText(storedText);
      setTextMigrated(true);
    }
    setLoaded(true);
  }, [type]);

  useEffect(() => {
    assetToDataUrl(companySettings.logoPath).then(setLogo);
    assetToDataUrl(companySettings.signaturePath).then(setSignature);
  }, []);

  const totals = useMemo(
    () => calculateQuoteTotals(formData.items, products, financials),
    [formData.items, products, financials],
  );

  const filteredQuotes = useMemo(
    () => filterAndSortQuotes(quotes, { query: search, fromDate, toDate, sort }),
    [quotes, search, fromDate, toDate, sort],
  );

  function addItem(productId: string) {
    setFormData((previous) => ({
      ...previous,
      items: [...previous.items, {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId,
        value: 1,
        quantity: 1,
        showQuantity: true,
      }],
    }));
  }

  function updateItem(id: string, field: "value" | "quantity", value: number) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  }

  function removeItem(id: string) {
    setFormData((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== id) }));
  }

  function newQuote() {
    setActiveQuote(null);
    setFormData({ name: "", address: "", items: [] });
  }

  function saveCurrentQuote() {
    if (!formData.name.trim()) {
      alert("Please enter the customer name first.");
      return;
    }

    const now = new Date().toISOString();
    const revision = activeQuote ? activeQuote.revision + 1 : 1;
    const quoteGroupId = activeQuote?.quoteGroupId ?? `${type}-${Date.now()}`;
    const saved: SavedQuote = {
      id: `quote-${Date.now()}`,
      quoteType: type,
      quoteGroupId,
      customerName: formData.name.trim(),
      title: `${formData.name.trim()} - Rev ${revision}`,
      revision,
      createdAt: now,
      updatedAt: now,
      formData: structuredClone(formData),
    };

    const next = [...quotes, saved];
    setQuotes(next);
    saveQuotes(type, next);
    setActiveQuote(saved);
    alert(`Quote saved as Revision ${revision}`);
  }

  function loadQuote(quote: SavedQuote) {
    setActiveQuote(quote);
    setFormData(structuredClone(quote.formData));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteQuote(id: string) {
    if (!confirm("Delete this saved revision?")) return;
    const next = quotes.filter((quote) => quote.id !== id);
    setQuotes(next);
    saveQuotes(type, next);
    if (activeQuote?.id === id) newQuote();
  }

  function customerPdf() {
    if (!textMigrated) {
      const proceed = confirm("The original text/terms have not been migrated for this quote type yet. Generate the PDF using the current fallback text anyway?");
      if (!proceed) return;
    }
    generateQuotationPdf({ formData, products, sections, financials, text, config, logoDataUrl: logo, signatureDataUrl: signature });
  }

  if (!loaded) return <div className="p-8">Loading quotation data…</div>;

  return (
    <main className={`min-h-screen ${config.pageClassName} p-4`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{companySettings.name}</p>
            <h1 className="text-3xl font-bold">{config.label} Quotation</h1>
            {activeQuote && <p className="text-sm text-muted-foreground">Editing from {activeQuote.title}; saving creates the next revision.</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={newQuote}>New Quote</Button>
            <Button asChild variant="outline"><Link href="/unified">Dashboard</Link></Button>
          </div>
        </header>

        {!catalogueMigrated && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-6 text-sm">
              This quote type is using the original fallback catalogue. Import the existing {config.label} app export to bring across Michael&apos;s current products, sections and saved quotations. <Link className="underline" href="/unified/migrate">Open migration</Link>.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Full Name</Label>
              <Input id="client-name" value={formData.name} onChange={(event) => setFormData((p) => ({ ...p, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-address">Address</Label>
              <Textarea id="client-address" value={formData.address} onChange={(event) => setFormData((p) => ({ ...p, address: event.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Select Products</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section) => {
              const sectionProducts = products.filter((product) => product.section === section.id);
              if (!sectionProducts.length) return null;
              return (
                <div key={section.id} className="space-y-3">
                  <h2 className="text-lg font-semibold">{section.name}</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {sectionProducts.map((product) => (
                      <div key={product.id} className="rounded-lg border bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                          <Button size="sm" onClick={() => addItem(product.id)}><Plus className="mr-1 h-4 w-4" />Add</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {formData.items.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Selected Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {formData.items.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.id} className="grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[1fr_130px_130px_120px_44px]">
                    <div><div className="font-medium">{product.name}</div><div className="text-sm text-muted-foreground">{product.description}</div></div>
                    <div className="space-y-1"><Label>{product.valueType === "unit" ? "Quantity" : product.valueType === "meter" ? "Length (m)" : "Area (m²)"}</Label><Input type="number" min="0" step={product.valueType === "unit" ? "1" : "0.01"} value={item.value} onChange={(event) => updateItem(item.id, "value", Number(event.target.value) || 0)} /></div>
                    <div className="space-y-1"><Label>Units</Label><Input type="number" min="1" step="1" disabled={product.valueType === "unit"} value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value) || 1)} /></div>
                    <div className="pb-2 text-right font-medium">{gbpFormatter.format(calculateItemTotal(item, products))}</div>
                    <Button variant="outline" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Quote Total</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Products</span><span>{gbpFormatter.format(totals.productsTotal)}</span></div>
            <div className="flex justify-between"><span>Total commission</span><span>{gbpFormatter.format(totals.totalCommission)}</span></div>
            <div className="flex justify-between"><span>Total VAT</span><span>{gbpFormatter.format(totals.totalVat)}</span></div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Grand Total</span><span>{gbpFormatter.format(totals.grandTotal)}</span></div>
            <div className="grid gap-2 pt-4 md:grid-cols-2 lg:grid-cols-4">
              <Button onClick={customerPdf}><Download className="mr-2 h-4 w-4" />Quotation PDF</Button>
              <Button variant="secondary" onClick={() => generateWorkingDetailsPdf({ formData, products, financials, logoDataUrl: logo, includeCosts: true })}><Download className="mr-2 h-4 w-4" />Internal Workings</Button>
              <Button variant="secondary" onClick={() => generateWorkingDetailsPdf({ formData, products, financials, logoDataUrl: logo, includeCosts: false })}><Download className="mr-2 h-4 w-4" />Client Workings</Button>
              <Button variant="outline" onClick={saveCurrentQuote}><Save className="mr-2 h-4 w-4" />Save Revision</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Saved Quotes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_190px]">
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search client, address or revision…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              <Select value={sort} onValueChange={(value: QuoteSort) => setSort(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="updated-desc">Recently updated</SelectItem><SelectItem value="created-desc">Newest</SelectItem><SelectItem value="created-asc">Oldest</SelectItem><SelectItem value="name-asc">Customer A-Z</SelectItem></SelectContent></Select>
            </div>

            <div className="space-y-2">
              {filteredQuotes.length === 0 && <p className="text-sm text-muted-foreground">No matching saved quotes.</p>}
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white/70 p-4">
                  <button className="flex-1 text-left" onClick={() => loadQuote(quote)}>
                    <div className="font-medium">{quote.customerName} — Rev {quote.revision}</div>
                    <div className="text-sm text-muted-foreground">{quote.formData.address || "No address"} · {new Date(quote.updatedAt).toLocaleString()}</div>
                  </button>
                  <Button size="icon" variant="outline" onClick={() => deleteQuote(quote.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
