import type { Product, QuotationItem, Section } from "@/types/quotation";

function formatArray(values: string[], description: string) {
  if (!values.length) return null;
  if (values.length === 1) return `${values[0]} ${description}`.trim();
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]} ${description}`.trim();
}

export function buildSectionParagraphs(sections: Section[], products: Product[], items: QuotationItem[]) {
  const itemsBySection = new Map<string, Array<{ product: Product; item: QuotationItem }>>();
  items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return;
    const existing = itemsBySection.get(product.section) ?? [];
    existing.push({ product, item });
    itemsBySection.set(product.section, existing);
  });

  return sections.flatMap((section) => {
    const sectionItems = itemsBySection.get(section.id);
    if (!sectionItems?.length) return [];

    const squareMeterage: string[] = [];
    const columns: string[] = [];
    const beams: string[] = [];
    const rhs: string[] = [];
    const velux: string[] = [];
    const roofLantern: string[] = [];
    const slimglaze: string[] = [];
    const upvc: string[] = [];
    const aluminium: string[] = [];
    const glazingVision: string[] = [];
    const descriptions: string[] = [];
    const other: string[] = [];

    const desc: Record<string, string> = {};

    sectionItems.forEach(({ product, item }) => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();

      if (name.includes("structural support columns")) {
        columns.push(`${item.value}x`);
        desc.columns ||= product.description;
      } else if (name.includes("steel beam") || /\bub\b/i.test(product.name) || description.includes("universal beam")) {
        beams.push(`${item.quantity ?? 1}x${item.value}m`);
        desc.beams ||= product.description;
      } else if (name.includes("rhs steel")) {
        rhs.push(`${item.value}x`);
        desc.rhs ||= product.description;
      } else if (description.includes("velux rooflight")) {
        velux.push(`${item.quantity}x ${product.name}`);
        desc.velux ||= product.description;
      } else if (description.includes("roof lantern")) {
        roofLantern.push(`${item.value}x ${product.name}`);
        desc.roofLantern ||= product.description;
      } else if (description.includes("slimglaze")) {
        slimglaze.push(`${item.value}x ${product.name}`);
        desc.slimglaze ||= product.description;
      } else if (description.includes("white upvc")) {
        upvc.push(`${item.value}x ${product.name}`);
        desc.upvc ||= product.description;
      } else if (description.includes("grey aluminium")) {
        aluminium.push(`${item.value}x ${product.name}`);
        desc.aluminium ||= product.description;
      } else if (description.includes("glazing vision")) {
        glazingVision.push(`${item.value}x ${product.name}`);
        desc.glazingVision ||= product.description;
      } else if (section.name.toLowerCase().includes("description")) {
        descriptions.push("");
        desc.descriptions ||= product.description;
      } else if (product.valueType === "meterage") {
        squareMeterage.push(`(${item.value}m²)`);
        desc.squareMeterage ||= product.description;
      } else {
        const multiplier = item.value > 1 ? `${item.value}x ` : "";
        other.push(`${multiplier}${product.description}`);
      }
    });

    const parts = [
      formatArray(squareMeterage, desc.squareMeterage ?? ""),
      formatArray(columns, desc.columns ?? "Structural Support Columns"),
      formatArray(beams, desc.beams ?? "Steel Beams"),
      formatArray(rhs, desc.rhs ?? "RHS Steel"),
      formatArray(velux, desc.velux ?? "Velux Rooflight"),
      formatArray(roofLantern, desc.roofLantern ?? "Roof Lantern"),
      formatArray(slimglaze, desc.slimglaze ?? "Slimglaze SG2 Double"),
      formatArray(upvc, desc.upvc ?? "White UPVC Window"),
      formatArray(aluminium, desc.aluminium ?? "Grey Aluminium Window"),
      formatArray(glazingVision, desc.glazingVision ?? "Glazing Vision Window"),
      formatArray(descriptions, desc.descriptions ?? ""),
      ...other,
    ].filter(Boolean) as string[];

    return [{
      sectionId: section.id,
      sectionName: section.name,
      hideHeading: section.name.toLowerCase().includes("description"),
      paragraph: `${parts.join(", ")}.`,
    }];
  });
}
