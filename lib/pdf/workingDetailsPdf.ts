import { jsPDF } from "jspdf";
import { companySettings } from "@/config/company";
import { calculateItemTotal, calculateQuoteTotals, gbpFormatter } from "@/lib/quotation/calculations";
import { ensureSpace, getLineHeight, writeWrappedText } from "@/lib/pdf/layout";
import type { FinancialSettings, Product, QuotationFormData } from "@/types/quotation";

interface WorkingDetailsOptions {
  formData: QuotationFormData;
  products: Product[];
  financials: FinancialSettings;
  logoDataUrl?: string | null;
  includeCosts?: boolean;
  fileName?: string;
  save?: boolean;
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "") || "quotation";
}

/**
 * One renderer for both Working Details variants.
 * - includeCosts=true: internal copy with prices, supplier/base-cost/markup and summary.
 * - includeCosts=false: client copy with descriptions/quantities only.
 */
export function generateWorkingDetailsPdf({
  formData,
  products,
  financials,
  logoDataUrl,
  includeCosts = true,
  fileName,
  save = true,
}: WorkingDetailsOptions) {
  const doc = new jsPDF();
  let y = 20;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 15, 15, 60, 30);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(includeCosts ? "Working Details - Internal Copy" : "Working Details - Client Copy", 105, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Client:", 130, 38);
  writeWrappedText(doc, formData.name, 148, 38, 42, { lineHeight: 4 });
  doc.text("Address:", 130, 48);
  writeWrappedText(doc, formData.address, 148, 48, 42, { lineHeight: 4 });

  y = 78;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ITEMISED WORKS", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  formData.items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return;

    const unit = product.valueType === "unit" ? "" : product.valueType === "meter" ? "m" : "m²";
    const quantityPrefix = product.valueType === "unit" ? `${item.value}x` : `${item.quantity}x ${item.value}${unit}`;
    const itemHeading = `${quantityPrefix} ${product.name}`;
    const headingHeight = getLineHeight(doc);

    y = ensureSpace(doc, y, includeCosts ? 24 : 15);

    doc.setFont("helvetica", "bold");
    doc.text(itemHeading, 20, y);
    if (includeCosts) {
      doc.text(gbpFormatter.format(calculateItemTotal(item, products)), 190, y, { align: "right" });
    }
    y += headingHeight + 1;

    doc.setFont("helvetica", "normal");
    y = writeWrappedText(doc, product.description, 25, y, includeCosts ? 100 : 165, {
      lineHeight: 4.2,
      paragraphGap: 2,
    });

    if (includeCosts) {
      y = ensureSpace(doc, y, 10);
      const baseCost = product.baseCost > 0 ? gbpFormatter.format(product.baseCost) : "N/A";
      const supplier = product.supplier || "N/A";
      const markup = product.baseCost > 0 ? `${product.markupPercent.toFixed(2)}%` : "N/A";
      doc.setFontSize(9);
      doc.text(`Base cost: ${baseCost}`, 25, y);
      doc.text(`Markup: ${markup}`, 85, y);
      y += 4.5;
      doc.text(`Supplier: ${supplier}`, 25, y);
      doc.setFontSize(10);
      y += 7;
    } else {
      y += 5;
    }
  });

  if (includeCosts) {
    const totals = calculateQuoteTotals(formData.items, products, financials);
    doc.addPage();
    y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PROJECT COST DETAILS", 20, y);
    y += 12;

    const rows: Array<[string, number]> = [
      ["Products Total", totals.productsTotal],
      [`VAT on Products (${financials.vatRate}%)`, totals.productsVat],
      ["Products + VAT", totals.productsTotalWithVat],
      [`Admin (${financials.commissionA}%)`, totals.commissionA],
      [`Marketing (${financials.commissionB}%)`, totals.commissionB],
      [`Commission (${financials.commissionC}%)`, totals.commissionC],
      ["Total Commission", totals.totalCommission],
      [`VAT on Commission (${financials.vatRate}%)`, totals.commissionVat],
      ["Total Cost", totals.totalCost],
      ["Total VAT", totals.totalVat],
      ["Grand Total", totals.grandTotal],
    ];

    doc.setFontSize(10);
    rows.forEach(([label, value], index) => {
      const isGrandTotal = index === rows.length - 1;
      doc.setFont("helvetica", isGrandTotal ? "bold" : "normal");
      doc.text(`${label}:`, 20, y);
      doc.text(gbpFormatter.format(value), 155, y, { align: "right" });
      y += 7;
    });
  }

  y = ensureSpace(doc, y + 12, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("On behalf of:", 20, y);
  y += 5;
  doc.text(companySettings.signatoryName, 20, y);
  y += 5;
  doc.text(companySettings.signatoryTitle, 20, y);
  y += 5;
  doc.text(companySettings.name, 20, y);
  y += 5;
  doc.text(companySettings.phone, 20, y);

  if (save) {
    const prefix = includeCosts ? "WD-internal" : "WD-client";
    const fallback = `${prefix}-${formData.name.replace(/\s+/g, "-") || "quotation"}`;
    doc.save(`${safeFileName(fileName ?? fallback)}.pdf`);
  }

  return doc;
}
