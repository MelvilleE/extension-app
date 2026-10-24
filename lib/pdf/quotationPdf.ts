import { jsPDF } from "jspdf";
import { companySettings } from "@/config/company";
import { buildSectionParagraphs } from "@/lib/pdf/descriptionFormatter";
import { ensureSpace, getLineHeight, writeHeading, writeWrappedText } from "@/lib/pdf/layout";
import { calculateQuoteTotals, gbpFormatter } from "@/lib/quotation/calculations";
import type {
  FinancialSettings,
  Product,
  QuoteTextSettings,
  QuoteTypeConfig,
  QuotationFormData,
  Section,
} from "@/types/quotation";

interface QuotationPdfOptions {
  formData: QuotationFormData;
  products: Product[];
  sections: Section[];
  financials: FinancialSettings;
  text: QuoteTextSettings;
  config: QuoteTypeConfig;
  logoDataUrl?: string | null;
  signatureDataUrl?: string | null;
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

export function generateQuotationPdf({
  formData,
  products,
  sections,
  financials,
  text,
  config,
  logoDataUrl,
  signatureDataUrl,
  fileName,
  save = true,
}: QuotationPdfOptions) {
  const doc = new jsPDF();
  const totals = calculateQuoteTotals(formData.items, products, financials);

  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", 15, 15, 60, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${config.label} Quotation`, 190, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Client:", 130, 34);
  writeWrappedText(doc, formData.name, 148, 34, 42, { lineHeight: 4 });
  doc.text("Address:", 130, 45);
  writeWrappedText(doc, formData.address, 148, 45, 42, { lineHeight: 4 });

  doc.addPage();
  let y = 20;

  y = writeHeading(doc, "BRIEF", 20, y, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  y = writeWrappedText(doc, text.briefText, 20, y, 170, { lineHeight: 4.7, paragraphGap: 3.5 });
  y += 6;

  y = writeHeading(doc, "DESCRIPTION OF WORK", 20, y, 12);
  doc.setFontSize(10.5);

  buildSectionParagraphs(sections, products, formData.items).forEach((section) => {
    const paragraphLines = doc.splitTextToSize(section.paragraph, 170) as string[];
    const required = paragraphLines.length * 4.7 + (section.hideHeading ? 0 : 8);
    y = ensureSpace(doc, y, required);

    if (!section.hideHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(section.sectionName, 20, y);
      y += getLineHeight(doc) + 1;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    y = writeWrappedText(doc, section.paragraph, 20, y, 170, { lineHeight: 4.7, paragraphGap: 2 });
    y += 4;
  });

  y = ensureSpace(doc, y + 4, 38);
  y = writeHeading(doc, "PRICING SUMMARY", 20, y, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Subtotal: ${gbpFormatter.format(totals.totalCost)}`, 20, y);
  y += 6;
  doc.text(`VAT (${financials.vatRate}%): ${gbpFormatter.format(totals.totalVat)}`, 20, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${gbpFormatter.format(totals.grandTotal)}`, 20, y);
  y += 12;

  y = writeHeading(doc, "ESTABLISHING THIS QUOTE", 20, y, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = writeWrappedText(doc, text.pricingText, 20, y, 170, { lineHeight: 4.5, paragraphGap: 3.5 });

  y = ensureSpace(doc, y + 8, signatureDataUrl ? 55 : 32);
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

  if (signatureDataUrl) doc.addImage(signatureDataUrl, "PNG", 20, y + 5, 75, 30);

  if (text.termsAndConditions.trim()) {
    doc.addPage();
    y = 20;
    y = writeHeading(doc, "TERMS AND CONDITIONS", 20, y, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    writeWrappedText(doc, text.termsAndConditions, 20, y, 170, { lineHeight: 3.8, paragraphGap: 2.5 });
  }

  if (save) {
    const fallback = `${config.id}-quotation-${formData.name.replace(/\s+/g, "-") || "client"}`;
    doc.save(`${safeFileName(fileName ?? fallback)}.pdf`);
  }

  return doc;
}
