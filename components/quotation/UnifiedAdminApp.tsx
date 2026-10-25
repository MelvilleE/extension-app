"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Edit, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import LogoManagement from "@/components/quotation/LogoManagement";
import { companySettings } from "@/config/company";
import { defaultProducts, defaultSections } from "@/config/default-catalog";
import { getQuoteTypeConfig } from "@/config/quote-types";
import {
  loadFinancialSettings,
  loadLogos,
  loadProducts,
  loadSections,
  loadTextSettings,
  saveFinancialSettings,
  saveLogos,
  saveProducts,
  saveSections,
  saveTextSettings,
} from "@/lib/quotation/storage";
import type { CoverImageSettings, FinancialSettings, Product, QuoteTextSettings, QuoteType, Section, ValueType } from "@/types/quotation";

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

function SortableSection({ section, children }: { section: Section; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="relative">
      <button type="button" className="absolute left-2 top-7 z-10 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted" {...attributes} {...listeners} aria-label={`Move ${section.name}`}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="pl-8">{children}</div>
    </div>
  );
}

async function defaultLogo(): Promise<CoverImageSettings | null> {
  try {
    const response = await fetch("/nllr_logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid logo"));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { id: "default-nllr-logo", name: "nllr_logo.png", src, x: 15, y: 15, width: 60, height: 30 };
  } catch {
    return null;
  }
}

export default function UnifiedAdminApp({ type }: { type: QuoteType }) {
  const config = getQuoteTypeConfig(type);
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [financials, setFinancials] = useState<FinancialSettings>(defaultFinancials);
  const [text, setText] = useState<QuoteTextSettings>({ briefText: config.defaultBrief, pricingText: config.defaultPricingText, termsAndConditions: "" });
  const [logos, setLogos] = useState<CoverImageSettings[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionToEditName, setSectionToEditName] = useState("");
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>(emptyProduct(defaultSections[0].id));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [logosExpanded, setLogosExpanded] = useState(false);
  const [commissionExpanded, setCommissionExpanded] = useState(false);
  const [manageSectionsExpanded, setManageSectionsExpanded] = useState(false);
  const [productFormExpanded, setProductFormExpanded] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [textSectionsExpanded, setTextSectionsExpanded] = useState(false);
  const [dataMigrationExpanded, setDataMigrationExpanded] = useState(false);
  const [status, setStatus] = useState("");
  const productFormRef = useRef<HTMLDivElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    const storedSections = loadSections(type);
    const storedProducts = loadProducts(type);
    const storedFinancials = loadFinancialSettings(type);
    const storedText = loadTextSettings(type);
    const storedLogos = loadLogos(type);
    const resolvedSections = storedSections?.length ? storedSections : defaultSections;
    setSections(resolvedSections);
    setProducts(storedProducts?.length ? storedProducts : defaultProducts);
    setFinancials(storedFinancials ?? defaultFinancials);
    if (storedText) setText(storedText);
    setNewProduct(emptyProduct(resolvedSections[0]?.id ?? ""));
    if (storedLogos.length) {
      setLogos(storedLogos);
    } else {
      defaultLogo().then((logo) => {
        if (!logo) return;
        setLogos([logo]);
        saveLogos(type, [logo]);
      });
    }
  }, [type]);

  function persistAll() {
    saveSections(type, sections);
    saveProducts(type, products);
    saveFinancialSettings(type, financials);
    saveTextSettings(type, text);
    saveLogos(type, logos);
    setStatus("Settings saved.");
  }

  function changeLogos(next: CoverImageSettings[]) {
    setLogos(next);
    saveLogos(type, next);
  }

  function handleAddSection() {
    if (!newSectionName.trim()) return;
    const next = [...sections, { id: `s${Date.now()}`, name: newSectionName.trim() }];
    setSections(next);
    saveSections(type, next);
    setNewSectionName("");
  }

  function handleEditSection(section: Section) {
    setEditingSection(section);
    setSectionToEditName(section.name);
  }

  function handleUpdateSection() {
    if (!editingSection || !sectionToEditName.trim()) return;
    const next = sections.map((section) => section.id === editingSection.id ? { ...section, name: sectionToEditName.trim() } : section);
    setSections(next);
    saveSections(type, next);
    setEditingSection(null);
    setSectionToEditName("");
  }

  function handleDeleteSection(id: string) {
    if (products.some((product) => product.section === id)) {
      alert("Cannot delete section with products. Please delete products first.");
      return;
    }
    const next = sections.filter((section) => section.id !== id);
    setSections(next);
    saveSections(type, next);
  }

  function handleEditProduct(product: Product) {
    setEditingProduct(product);
    setNewProduct({ ...product, customPrices: product.customPrices ? product.customPrices.map((tier) => ({ ...tier })) : [{ value: 0, price: 0 }] });
    setProductFormExpanded(true);
    setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function resetProductForm() {
    setEditingProduct(null);
    setNewProduct(emptyProduct(sections[0]?.id ?? ""));
  }

  function saveProduct() {
    if (!newProduct.name.trim() || (!newProduct.isCustomPricing && newProduct.price < 0)) return;
    const cleanProduct = {
      ...newProduct,
      customPrices: newProduct.isCustomPricing ? (newProduct.customPrices ?? []).filter((tier) => tier.value >= 0 && tier.price >= 0) : undefined,
    };
    let next: Product[];
    if (editingProduct) {
      next = products.map((product) => product.id === editingProduct.id ? { ...cleanProduct, id: editingProduct.id } : product);
    } else {
      next = [...products, { ...cleanProduct, id: `p${Date.now()}` }];
    }
    setProducts(next);
    saveProducts(type, next);
    resetProductForm();
    setStatus(editingProduct ? "Product updated." : "Product added.");
  }

  function handleDeleteProduct(id: string) {
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    saveProducts(type, next);
  }

  function setBaseCost(baseCost: number) {
    setNewProduct({
      ...newProduct,
      baseCost,
      price: newProduct.isCustomPricing ? newProduct.price : Number((baseCost * (1 + ((newProduct.markupPercent ?? 0) / 100))).toFixed(2)),
    });
  }

  function setMarkup(markupPercent: number) {
    setNewProduct({
      ...newProduct,
      markupPercent,
      price: newProduct.isCustomPricing ? newProduct.price : Number(((newProduct.baseCost ?? 0) * (1 + markupPercent / 100)).toFixed(2)),
    });
  }

  function updateTier(index: number, field: "value" | "price", value: number) {
    const tiers = [...(newProduct.customPrices ?? [])];
    tiers[index] = { ...tiers[index], [field]: value };
    setNewProduct({ ...newProduct, customPrices: tiers });
  }

  function toggleSection(id: string) {
    setOpenSections((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);
    saveSections(type, next);
  }

  const valueUnit = newProduct.valueType === "unit" ? "unit" : newProduct.valueType === "meter" ? "meter" : "m²";

  return (
    <main className={`min-h-screen ${config.pageClassName} p-4`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-primary">{config.label} Quotations - Admin Management</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/unified/${type}`}>Open Quote Builder</Link></Button>
            <Button asChild variant="outline"><Link href="/unified">Dashboard</Link></Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setLogosExpanded((previous) => !previous)}>
            <CardTitle>Logo Management</CardTitle><span className="text-sm text-gray-500">{logosExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {logosExpanded && <CardContent className="space-y-4"><LogoManagement logos={logos} onChange={changeLogos} /></CardContent>}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setCommissionExpanded((previous) => !previous)}>
            <CardTitle>Commission & VAT Settings</CardTitle><span className="text-sm text-gray-500">{commissionExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {commissionExpanded && (
            <CardContent className="space-y-4">
              <div className="border-t pt-4"><Label>Admin (%)</Label><Input type="number" min="0" max="100" step="0.1" value={financials.commissionA} onChange={(event) => setFinancials({ ...financials, commissionA: parseFloat(event.target.value) || 0 })} /></div>
              <div className="border-t pt-4"><Label>Marketing (%)</Label><Input type="number" min="0" max="100" step="0.1" value={financials.commissionB} onChange={(event) => setFinancials({ ...financials, commissionB: parseFloat(event.target.value) || 0 })} /></div>
              <div className="border-t pt-4"><Label>Commission (%)</Label><Input type="number" min="0" max="100" step="0.1" value={financials.commissionC} onChange={(event) => setFinancials({ ...financials, commissionC: parseFloat(event.target.value) || 0 })} /></div>
              <div className="border-t pt-4"><Label>VAT Rate (%)</Label><Input type="number" min="0" max="100" step="0.1" value={financials.vatRate} onChange={(event) => setFinancials({ ...financials, vatRate: parseFloat(event.target.value) || 0 })} /></div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setManageSectionsExpanded((previous) => !previous)}>
            <CardTitle>Manage Sections</CardTitle><span className="text-sm text-gray-500">{manageSectionsExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {manageSectionsExpanded && (
            <CardContent className="space-y-4">
              <div className="flex gap-2"><Input value={newSectionName} onChange={(event) => setNewSectionName(event.target.value)} placeholder="New section name" /><Button onClick={handleAddSection}><Plus className="mr-2 h-4 w-4" />Add Section</Button></div>
              <div className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between rounded-lg border p-3">
                    {editingSection?.id === section.id ? (
                      <div className="flex flex-1 gap-2"><Input value={sectionToEditName} onChange={(event) => setSectionToEditName(event.target.value)} placeholder="Section name" /><Button onClick={handleUpdateSection} size="sm"><Save className="h-4 w-4" /></Button><Button variant="outline" onClick={() => setEditingSection(null)} size="sm">Cancel</Button></div>
                    ) : (
                      <><span>{section.name}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditSection(section)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteSection(section.id)}><Trash2 className="h-4 w-4" /></Button></div></>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card ref={productFormRef} className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setProductFormExpanded((previous) => !previous)}>
            <CardTitle>Add New Product</CardTitle><span className="text-sm text-gray-500">{productFormExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {productFormExpanded && (
            <CardContent className="space-y-4">
              <div><Label htmlFor="productName">Product Name</Label><Input id="productName" value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} placeholder="e.g. Double Glazed Window" /></div>
              <div><Label htmlFor="productDescription">Description</Label><Textarea id="productDescription" value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} placeholder="Product description..." /></div>
              <div><Label>Value Type</Label><Select value={newProduct.valueType} onValueChange={(value: ValueType) => setNewProduct({ ...newProduct, valueType: value })}><SelectTrigger><SelectValue placeholder="Select value type" /></SelectTrigger><SelectContent><SelectItem value="unit">Unit (individual items)</SelectItem><SelectItem value="meter">Meter (length)</SelectItem><SelectItem value="meterage">Meterage (area m²)</SelectItem></SelectContent></Select></div>
              <div><Label>Base Cost (£)</Label><Input type="number" min="0" step="0.01" placeholder="Base Cost (£)" value={newProduct.baseCost ?? 0} onChange={(event) => setBaseCost(parseFloat(event.target.value) || 0)} /></div>
              <div><Label>Supplier</Label><Input value={newProduct.supplier} onChange={(event) => setNewProduct({ ...newProduct, supplier: event.target.value })} placeholder="Supplier information" /></div>
              <div><Label>Markup Percentage(%)</Label><Input type="number" min="0" step="0.01" placeholder="Markup Percentage (%)" value={newProduct.markupPercent ?? 0} onChange={(event) => setMarkup(parseFloat(event.target.value) || 0)} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="custom-pricing" checked={newProduct.isCustomPricing ?? false} onCheckedChange={(checked) => setNewProduct({ ...newProduct, isCustomPricing: checked as boolean, price: checked ? 0 : newProduct.price })} /><Label htmlFor="custom-pricing">Custom Pricing</Label></div>

              {!newProduct.isCustomPricing ? (
                <div><Label>Price (£ per {valueUnit})</Label><Input type="number" min="0" step="0.01" value={newProduct.price ?? ""} onChange={(event) => setNewProduct({ ...newProduct, price: parseFloat(event.target.value) || 0 })} placeholder="0.00" /></div>
              ) : (
                <div className="space-y-2">
                  <Label>Custom Pricing Tiers</Label>
                  {(newProduct.customPrices ?? []).map((tier, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="flex-1"><Label>Value ({newProduct.valueType === "unit" ? "units" : newProduct.valueType === "meter" ? "meters" : "m²"})</Label><Input type="number" min="0" step={newProduct.valueType === "unit" ? "1" : "0.01"} placeholder={newProduct.valueType === "unit" ? "Quantity" : newProduct.valueType === "meter" ? "Length (m)" : "Area (m²)"} value={tier.value ?? ""} onChange={(event) => updateTier(index, "value", parseFloat(event.target.value) || 0)} /></div>
                      <div className="flex-1"><Label>Price (£)</Label><Input type="number" min="0" step="0.01" placeholder="Price" value={tier.price ?? ""} onChange={(event) => updateTier(index, "price", parseFloat(event.target.value) || 0)} /></div>
                      <Button variant="outline" size="icon" onClick={() => setNewProduct({ ...newProduct, customPrices: (newProduct.customPrices ?? []).filter((_, tierIndex) => tierIndex !== index) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setNewProduct({ ...newProduct, customPrices: [...(newProduct.customPrices ?? []), { value: 0, price: 0 }] })}><Plus className="mr-2 h-4 w-4" />Add Tier</Button>
                </div>
              )}

              <div><Label>Section</Label><Select value={newProduct.section} onValueChange={(value) => setNewProduct({ ...newProduct, section: value })}><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger><SelectContent>{sections.map((section) => <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>)}</SelectContent></Select></div>
              <Button onClick={saveProduct} className="w-full">{editingProduct ? <><Save className="mr-2 h-4 w-4" />Update Product</> : <><Plus className="mr-2 h-4 w-4" />Add Product</>}</Button>
              {editingProduct && <Button variant="outline" onClick={resetProductForm} className="w-full">Cancel Edit</Button>}
            </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setSectionsExpanded((previous) => !previous)}>
            <CardTitle>Sections</CardTitle><span className="text-sm text-gray-500">{sectionsExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {sectionsExpanded && (
            <CardContent className="space-y-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {sections.map((section) => {
                      const sectionProducts = products.filter((product) => product.section === section.id);
                      if (!sectionProducts.length) return null;
                      return (
                        <SortableSection key={section.id} section={section}>
                          <Card className="mb-8">
                            <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => toggleSection(section.id)}>
                              <CardTitle>{section.name}</CardTitle><span className="text-sm text-gray-500">{openSections.includes(section.id) ? "▲" : "▼"}</span>
                            </CardHeader>
                            {openSections.includes(section.id) && (
                              <CardContent className="space-y-4">
                                {sectionProducts.map((product) => (
                                  <div key={product.id} className="flex items-start justify-between rounded-lg border p-4">
                                    <div className="flex-1">
                                      <h3 className="font-medium">{product.name}</h3>
                                      <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                                      <div className="mt-1 text-sm text-muted-foreground">Value Type: {product.valueType === "unit" ? "Unit" : product.valueType === "meter" ? "Meter (length)" : "Meterage (area m²)"}</div>
                                      {product.isCustomPricing ? (
                                        <div className="mt-2 text-sm text-muted-foreground">Custom Pricing:{product.customPrices?.map((tier, index) => <span key={index} className="block">{tier.value} {product.valueType === "unit" ? "units" : product.valueType === "meter" ? "m" : "m²"} = £{tier.price.toFixed(2)}</span>)}</div>
                                      ) : (
                                        <p className="mt-1 text-sm text-muted-foreground">£{product.price.toFixed(2)} per {product.valueType === "unit" ? "unit" : product.valueType === "meter" ? "meter" : "m²"}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button></div>
                                  </div>
                                ))}
                              </CardContent>
                            )}
                          </Card>
                        </SortableSection>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setTextSectionsExpanded((previous) => !previous)}>
            <CardTitle>Text Sections</CardTitle><span className="text-sm text-gray-500">{textSectionsExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {textSectionsExpanded && (
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Brief</Label><Textarea placeholder="Free text area to enter the Brief Text for the quotation PDF..." className="min-h-[120px]" value={text.briefText} onChange={(event) => setText({ ...text, briefText: event.target.value })} /></div>
              <div className="space-y-2"><Label>Establishing End Cost</Label><Textarea placeholder="Free text area to enter pricing Text for the quotation PDF..." className="min-h-[120px]" value={text.pricingText} onChange={(event) => setText({ ...text, pricingText: event.target.value })} /></div>
              <div className="space-y-2"><Label>Terms & Conditions</Label><Textarea placeholder="Free text area to enter terms and conditions for the quotation PDF..." className="min-h-[120px]" value={text.termsAndConditions} onChange={(event) => setText({ ...text, termsAndConditions: event.target.value })} /></div>
            </CardContent>
          )}
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between" onClick={() => setDataMigrationExpanded((previous) => !previous)}>
            <CardTitle>Data Migration</CardTitle><span className="text-sm text-gray-500">{dataMigrationExpanded ? "▲" : "▼"}</span>
          </CardHeader>
          {dataMigrationExpanded && <CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Import the existing Loft or Extension browser data into this unified system.</p><Button asChild variant="outline"><Link href="/unified/migrate">Open Data Migration</Link></Button></CardContent>}
        </Card>

        <div className="sticky bottom-4 mb-6 flex items-center justify-between gap-3 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur"><span className="text-sm">{status}</span><Button onClick={persistAll}><Save className="mr-2 h-4 w-4" />Save All Settings</Button></div>
        <div className="text-center text-sm text-muted-foreground">Developed by Ted Melville - 2025-26</div>
      </div>
    </main>
  );
}
