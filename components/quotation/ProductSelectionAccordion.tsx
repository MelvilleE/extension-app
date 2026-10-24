"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gbpFormatter } from "@/lib/quotation/calculations";
import type { Product, QuotationItem, Section } from "@/types/quotation";

interface ProductSelectionAccordionProps {
  sections: Section[];
  products: Product[];
  items: QuotationItem[];
  onAddItem: (productId: string) => void;
  onUpdateItem: (itemId: string, field: "value" | "quantity", value: number) => void;
  onRemoveItem: (itemId: string) => void;
  calculateItemTotal: (item: QuotationItem) => number;
}

export default function ProductSelectionAccordion({
  sections,
  products,
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  calculateItemTotal,
}: ProductSelectionAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between"
        onClick={() => setExpanded((previous) => !previous)}
      >
        <CardTitle>Select Products</CardTitle>
        <span className="text-sm text-gray-500">{expanded ? "▲" : "▼"}</span>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4">
          <Accordion type="multiple" className="space-y-4">
            {sections.map((section) => {
              const sectionProducts = products.filter((product) => product.section === section.id);
              if (!sectionProducts.length) return null;

              return (
                <AccordionItem value={section.id} key={section.id}>
                  <Card className="mb-2">
                    <CardHeader>
                      <AccordionTrigger>
                        <CardTitle>{section.name}</CardTitle>
                      </AccordionTrigger>
                    </CardHeader>

                    <AccordionContent>
                      <CardContent className="space-y-4">
                        {sectionProducts.map((product) => {
                          const productItems = items.filter((item) => item.productId === product.id);

                          return (
                            <div key={product.id} className="rounded-lg border p-4">
                              <div className="mb-3 flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-medium">{product.name}</h3>
                                  <p className="text-sm text-muted-foreground">{product.description}</p>
                                  {product.isCustomPricing ? (
                                    <div className="mt-1 text-sm text-muted-foreground">Custom pricing - see details</div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      {gbpFormatter.format(product.price)} per {product.valueType === "unit" ? "unit" : product.valueType === "meter" ? "meter" : "m²"}
                                    </p>
                                  )}
                                </div>

                                <Button onClick={() => onAddItem(product.id)} size="sm">
                                  <Plus className="mr-1 h-4 w-4" />
                                  Add
                                </Button>
                              </div>

                              {productItems.length > 0 && (
                                <div className="mt-3 space-y-3">
                                  {productItems.map((item) => (
                                    <div key={item.id} className="flex flex-wrap items-center gap-2 rounded border p-2">
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor={`value-${item.id}`} className="text-sm">
                                          {product.valueType === "unit" ? "Quantity" : product.valueType === "meter" ? "Length (m)" : "Area (m²)"}
                                        </Label>
                                        <Input
                                          id={`value-${item.id}`}
                                          type="number"
                                          min="0"
                                          step={product.valueType === "unit" ? "1" : "0.01"}
                                          value={item.value}
                                          onChange={(event) => onUpdateItem(item.id, "value", Number(event.target.value) || 0)}
                                          className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          {product.valueType === "unit" ? "units" : product.valueType === "meter" ? "m" : "m²"}
                                        </span>
                                      </div>

                                      {product.valueType !== "unit" && (
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor={`quantity-${item.id}`} className="text-sm">Quantity</Label>
                                          <Input
                                            id={`quantity-${item.id}`}
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.quantity}
                                            onChange={(event) => onUpdateItem(item.id, "quantity", Number(event.target.value) || 1)}
                                            className="w-20"
                                          />
                                          <span className="text-sm text-muted-foreground">units</span>
                                        </div>
                                      )}

                                      <div className="ml-auto flex items-center gap-2">
                                        <span className="text-sm font-medium">{gbpFormatter.format(calculateItemTotal(item))}</span>
                                        <Button variant="outline" size="icon" onClick={() => onRemoveItem(item.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      )}
    </Card>
  );
}
