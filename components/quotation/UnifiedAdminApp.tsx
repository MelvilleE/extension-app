"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Edit, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { companySettings } from "@/config/company";
import { defaultProducts, defaultSections } from "@/config/default-catalog";
import { getQuoteTypeConfig } from "@/config/quote-types";
import {
  loadFinancialSettings,
  loadProducts,
  loadSections,
  loadTextSettings,
  saveFinancialSettings,
  saveProducts,
  saveSections,
  saveTextSettings,
} from "@/lib/quotation/storage";
import type { FinancialSettings, Product, QuoteTextSettings, QuoteType, Section, ValueType } from "@/types/quotation";

const defaultFinancials: FinancialSettings = { vatRate: 20, commissionA: 0.5, commissionB: 1, commissionC: 2.5 };

function emptyProduct(section: string): Omit<Product, "id"> {
  return {
    name: "",
    description: "",
    section,
    baseCost: 0,
    supplier: "",
    markupPercent: 0,
    price: 0,
    valueType: "unit",
    isCustomPricing: false,
    customPrices: [{ value: 0, price: 0 }],
  };
}

export default function UnifiedAdminApp({ type }: { type: QuoteType }) {
  const config = getQuoteTypeConfig(type);
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [financials, setFinancials] = useState<FinancialSettings>(defaultFinancials);
  const [text, setText] = useState<QuoteTextSettings>({ briefText: config.defaultBrief, pricingText: config.defaultPricingText, termsAndConditions: "" });
  const [newSection, setNewSection] = useState("");
  const [draft, setDraft] = useState<Omit<Product, "id">>(emptyProduct(defaultSections[0].id));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const storedSections = loadSections(type);
    const storedProducts = loadProducts(type);
    const storedFinancials = loadFinancialSettings(type);
    const storedText = loadTextSettings(type);
    const resolvedSections = storedSections?.length ? storedSections : defaultSections;
    setSections(resolvedSections);
    setProducts(storedProducts?.length ? storedProducts : defaultProducts);
    if (storedFinancials) setFinancials(storedFinancials);
    if (storedText) setText(storedText);
    setDraft(emptyProduct(resolvedSections[0]?.id ?? ""));
  }, [type]);

  function persistAll(nextSections = sections, nextProducts = products) {
    saveSections(type, nextSections);
    saveProducts(type, nextProducts);
    saveFinancialSettings(type, financials);
    saveTextSettings(type, text);
    setStatus("Settings saved.");
  }

  function addSection() {
    const name = newSection.trim();
    if (!name) return;
    const next = [...sections, { id: `section-${Date.now()}`, name }];
    setSections(next);
    saveSections(type, next);
    setNewSection("");
  }

  function deleteSection(id: string) {
    if (products.some((product) => product.section === id)) {
      alert("Move or delete products in this section first.");
      return;
    }
    const next = sections.filter((section) => section.id !== id);
    setSections(next);
    saveSections(type, next);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    saveSections(type, next);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setDraft({ ...product, customPrices: product.customPrices ? [...product.customPrices] : [{ value: 0, price: 0 }] });
  }

  function saveProduct() {
    if (!draft.name.trim() || !draft.section) return;
    let next: Product[];
    if (editingId) {
      next = products.map((product) => product.id === editingId ? { ...draft, id: editingId } : product);
    } else {
      next = [...products, { ...draft, id: `product-${Date.now()}` }];
    }
    setProducts(next);
    saveProducts(type, next);
    setEditingId(null);
    setDraft(emptyProduct(sections[0]?.id ?? ""));
  }

  function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    saveProducts(type, next);
  }

  function setBaseCost(value: number) {
    const price = draft.isCustomPricing ? draft.price : Number((value * (1 + draft.markupPercent / 100)).toFixed(2));
    setDraft({ ...draft, baseCost: value, price });
  }

  function setMarkup(value: number) {
    const price = draft.isCustomPricing ? draft.price : Number((draft.baseCost * (1 + value / 100)).toFixed(2));
    setDraft({ ...draft, markupPercent: value, price });
  }

  return (
    <main className={`min-h-screen ${config.pageClassName} p-4`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm text-muted-foreground">{companySettings.name}</p><h1 className="text-3xl font-bold">{config.label} Admin</h1></div>
          <div className="flex gap-2"><Button asChild variant="outline"><Link href={`/unified/${type}`}>Open Quote Builder</Link></Button><Button asChild variant="outline"><Link href="/unified">Dashboard</Link></Button></div>
        </header>

        <Card>
          <CardHeader><CardTitle>Company Signature</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <div><span className="font-medium">Name:</span> {companySettings.signatoryName}</div>
            <div><span className="font-medium">Role:</span> {companySettings.signatoryTitle}</div>
            <div><span className="font-medium">Company:</span> {companySettings.name}</div>
            <div><span className="font-medium">Phone:</span> {companySettings.phone}</div>
            <p className="col-span-full text-muted-foreground">These are global company settings, so both Loft and Extension PDFs use the same signature details.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Commission & VAT</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {([
              ["VAT %", "vatRate"],
              ["Admin %", "commissionA"],
              ["Marketing %", "commissionB"],
              ["Commission %", "commissionC"],
            ] as const).map(([label, key]) => (
              <div className="space-y-2" key={key}><Label>{label}</Label><Input type="number" step="0.1" min="0" value={financials[key]} onChange={(event) => setFinancials({ ...financials, [key]: Number(event.target.value) || 0 })} /></div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sections</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2"><Input placeholder="New section name" value={newSection} onChange={(event) => setNewSection(event.target.value)} /><Button onClick={addSection}><Plus className="mr-2 h-4 w-4" />Add</Button></div>
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center justify-between rounded-lg border bg-white/70 p-3">
                <span className="font-medium">{section.name}</span>
                <div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => moveSection(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => deleteSection(section.id)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Product" : "Add Product"}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div className="space-y-2"><Label>Section</Label><Select value={draft.section} onValueChange={(value) => setDraft({ ...draft, section: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sections.map((section) => <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div>
            <div className="space-y-2"><Label>Value type</Label><Select value={draft.valueType} onValueChange={(value) => setDraft({ ...draft, valueType: value as ValueType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unit">Unit</SelectItem><SelectItem value="meter">Metre</SelectItem><SelectItem value="meterage">Area (m²)</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Supplier</Label><Input value={draft.supplier} onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} /></div>
            <div className="space-y-2"><Label>Base Cost (£)</Label><Input type="number" min="0" step="0.01" value={draft.baseCost} onChange={(event) => setBaseCost(Number(event.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Markup (%)</Label><Input type="number" min="0" step="0.01" value={draft.markupPercent} onChange={(event) => setMarkup(Number(event.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Price (£)</Label><Input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) || 0 })} /></div>
            <div className="flex items-center gap-2 pt-7"><Checkbox checked={Boolean(draft.isCustomPricing)} onCheckedChange={(checked) => setDraft({ ...draft, isCustomPricing: Boolean(checked) })} /><Label>Custom pricing</Label></div>
            <div className="md:col-span-2 flex gap-2"><Button onClick={saveProduct}><Save className="mr-2 h-4 w-4" />{editingId ? "Update Product" : "Add Product"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setDraft(emptyProduct(sections[0]?.id ?? "")); }}>Cancel</Button>}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => {
              const sectionProducts = products.filter((product) => product.section === section.id);
              if (!sectionProducts.length) return null;
              return <div key={section.id} className="space-y-2"><h2 className="font-semibold">{section.name}</h2>{sectionProducts.map((product) => <div key={product.id} className="flex items-start justify-between gap-3 rounded-lg border bg-white/70 p-3"><div><div className="font-medium">{product.name}</div><div className="text-sm text-muted-foreground">{product.description}</div><div className="text-sm">£{product.price.toFixed(2)}</div></div><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => editProduct(product)}><Edit className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>;
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>PDF Text Sections</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label>Brief</Label><Textarea className="min-h-36" value={text.briefText} onChange={(event) => setText({ ...text, briefText: event.target.value })} /></div>
            <div className="space-y-2"><Label>Establishing End Cost</Label><Textarea className="min-h-52" value={text.pricingText} onChange={(event) => setText({ ...text, pricingText: event.target.value })} /></div>
            <div className="space-y-2"><Label>Terms & Conditions</Label><Textarea className="min-h-72" value={text.termsAndConditions} onChange={(event) => setText({ ...text, termsAndConditions: event.target.value })} /></div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur flex items-center justify-between gap-3"><span className="text-sm">{status}</span><Button onClick={() => persistAll()}><Save className="mr-2 h-4 w-4" />Save All Settings</Button></div>
      </div>
    </main>
  );
}
