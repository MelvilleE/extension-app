"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductSelectionAccordion from "@/components/quotation/ProductSelectionAccordion";
import QuoteSummaryArchive from "@/components/quotation/QuoteSummaryArchive";
import { companySettings } from "@/config/company";
import { defaultProducts, defaultSections } from "@/config/default-catalog";
import { getQuoteTypeConfig } from "@/config/quote-types";
import { generateQuotationPdf } from "@/lib/pdf/quotationPdf";
import { generateWorkingDetailsPdf } from "@/lib/pdf/workingDetailsPdf";
import { calculateItemTotal, calculateQuoteTotals } from "@/lib/quotation/calculations";
import { filterAndSortQuotes, type QuoteSort } from "@/lib/quotation/search";
import { loadFinancialSettings, loadProducts, loadQuotes, loadSections, loadTextSettings, saveQuotes } from "@/lib/quotation/storage";
import type { FinancialSettings, Product, QuoteTextSettings, QuoteType, QuotationFormData, SavedQuote, Section } from "@/types/quotation";

const defaultFinancials: FinancialSettings = { vatRate: 20, commissionA: 0.5, commissionB: 1, commissionC: 2.5 };

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

export default function UnifiedQuotationAppClassic({ type }: { type: QuoteType }) {
  const config = getQuoteTypeConfig(type);
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [activeQuote, setActiveQuote] = useState<SavedQuote | null>(null);
  const [formData, setFormData] = useState<QuotationFormData>({ name: "", address: "", items: [] });
  const [financials, setFinancials] = useState<FinancialSettings>(defaultFinancials);
  const [text, setText] = useState<QuoteTextSettings>({ briefText: config.defaultBrief, pricingText: config.defaultPricingText, termsAndConditions: "" });
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
    const storedText = loadTextSettings(type);
    if (storedSections?.length) setSections(storedSections);
    if (storedProducts?.length) setProducts(storedProducts);
    setCatalogueMigrated(Boolean(storedSections?.length || storedProducts?.length));
    setQuotes(loadQuotes(type));
    setFinancials(loadFinancialSettings(type) ?? defaultFinancials);
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

  const totals = useMemo(() => calculateQuoteTotals(formData.items, products, financials), [formData.items, products, financials]);
  const filteredQuotes = useMemo(() => filterAndSortQuotes(quotes, { query: search, fromDate, toDate, sort }), [quotes, search, fromDate, toDate, sort]);

  function addItem(productId: string) {
    setFormData((previous) => ({ ...previous, items: [...previous.items, { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, productId, value: 1, quantity: 1, showQuantity: true }] }));
  }

  function updateItem(id: string, field: "value" | "quantity", value: number) {
    setFormData((previous) => ({ ...previous, items: previous.items.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }

  function removeItem(id: string) {
    setFormData((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== id) }));
  }

  function newQuote() {
    setActiveQuote(null);
    setFormData({ name: "", address: "", items: [] });
  }

  function saveCurrentQuote() {
    if (!formData.name.trim()) return alert("Please enter customer name");
    const now = new Date().toISOString();
    const revision = activeQuote ? activeQuote.revision + 1 : 1;
    const saved: SavedQuote = {
      id: `quote-${Date.now()}`,
      quoteType: type,
      quoteGroupId: activeQuote?.quoteGroupId ?? `${type}-${Date.now()}`,
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
    if (!textMigrated && !confirm("Original quotation text has not been migrated yet. Generate using fallback text?")) return;
    generateQuotationPdf({ formData, products, sections, financials, text, config, logoDataUrl: logo, signatureDataUrl: signature });
  }

  if (!loaded) return <div className="p-8">Loading quotation data…</div>;

  return (
    <main className={`min-h-screen ${config.pageClassName} p-4`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{companySettings.name}</p>
            <h1 className="text-3xl font-bold text-primary">{config.label} Quote Generator</h1>
            {activeQuote && <p className="mt-1 text-sm text-muted-foreground">Editing from {activeQuote.title}; saving creates the next revision.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={newQuote}>New Quote</Button>
            <Button asChild variant="outline"><Link href={`/unified/${type}/admin`}>Admin</Link></Button>
            <Button asChild variant="outline"><Link href="/unified">Dashboard</Link></Button>
          </div>
        </div>

        {!catalogueMigrated && <Card className="mb-8 border-amber-300 bg-amber-50"><CardContent className="pt-6 text-sm">This quote type is using the fallback catalogue. <Link className="underline" href="/unified/migrate">Import the existing {config.label} data</Link> to restore the live products, sections and quote history.</CardContent></Card>}

        <Card className="mb-8">
          <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label htmlFor="client-name">Full Name</Label><Input id="client-name" value={formData.name} onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))} placeholder="e.g. John Smith" /></div>
            <div><Label htmlFor="client-address">Client Address</Label><Textarea id="client-address" value={formData.address} onChange={(event) => setFormData((previous) => ({ ...previous, address: event.target.value }))} placeholder="e.g. 123 Main Street, London" /></div>
          </CardContent>
        </Card>

        <ProductSelectionAccordion sections={sections} products={products} items={formData.items} onAddItem={addItem} onUpdateItem={updateItem} onRemoveItem={removeItem} calculateItemTotal={(item) => calculateItemTotal(item, products)} />

        <QuoteSummaryArchive
          label={config.label}
          formData={formData}
          products={products}
          financials={financials}
          totals={totals}
          quotes={filteredQuotes}
          activeQuote={activeQuote}
          search={search}
          fromDate={fromDate}
          toDate={toDate}
          sort={sort}
          onSearchChange={setSearch}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onSortChange={setSort}
          onLoadQuote={loadQuote}
          onDeleteQuote={deleteQuote}
          onCustomerPdf={customerPdf}
          onInternalWorkings={() => generateWorkingDetailsPdf({ formData, products, financials, logoDataUrl: logo, includeCosts: true })}
          onClientWorkings={() => generateWorkingDetailsPdf({ formData, products, financials, logoDataUrl: logo, includeCosts: false })}
          onSaveQuote={saveCurrentQuote}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">Developed by Ted Melville</div>
      </div>
    </main>
  );
}
