import { jsPDF } from "jspdf";
import { companySettings } from "@/config/company";
import { buildSectionParagraphs } from "@/lib/pdf/descriptionFormatter";
import { ensureSpace, getLineHeight, writeHeading, writeWrappedText } from "@/lib/pdf/layout";
import { calculateQuoteTotals, gbpFormatter } from "@/lib/quotation/calculations";
import type {
  CoverImageSettings,
  FinancialSettings,
  Product,
  QuoteTextSettings,
  QuoteTypeConfig,
  QuotationFormData,
  Section,
  SignatureSettings,
} from "@/types/quotation";

interface QuotationPdfOptions {
  formData: QuotationFormData;
  products: Product[];
  sections: Section[];
  financials: FinancialSettings;
  text: QuoteTextSettings;
  config: QuoteTypeConfig;
  logoDataUrl?: string | null;
  logos?: CoverImageSettings[];
  signatureDataUrl?: string | null;
  signatureSettings?: SignatureSettings | null;
  fileName?: string;
  save?: boolean;
}

function safeFileName(value: string) {
  return value.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ").replace(/\.+$/g, "") || "quotation";
}

function imageFormat(src: string) {
  return /^data:image\/jpe?g/i.test(src) ? "JPEG" : "PNG";
}

export function generateQuotationPdf({ formData, products, sections, financials, text, config, logoDataUrl, logos = [], signatureDataUrl, signatureSettings, fileName, save = true }: QuotationPdfOptions) {
  const doc = new jsPDF();
  const totals = calculateQuoteTotals(formData.items, products, financials);

  if (logos.length) {
    logos.forEach((logo) => doc.addImage(logo.src, imageFormat(logo.src), logo.x, logo.y, logo.width, logo.height));
  } else if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 15, 15, 60, 30);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const wrappedName = doc.splitTextToSize(formData.name, 50) as string[];
  const wrappedAddress = doc.splitTextToSize(formData.address, 50) as string[];
  doc.text("Client: ", 135, 30);
  doc.text(wrappedName, 155, 30);
  doc.text("Address: ", 135, 42);
  doc.text(wrappedAddress, 155, 42);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 255);
  doc.setFont("times", "normal");
  const sectionTitle = "SMART SOLUTIONS FOR MODERN LIVING";
  doc.text(sectionTitle, 105, 67, { align: "center" });
  const sectionTitleWidth = doc.getTextWidth(sectionTitle);
  doc.setDrawColor(0, 0, 255);
  doc.setLineWidth(0.5);
  doc.line(105 - sectionTitleWidth / 2, 68, 105 + sectionTitleWidth / 2, 68);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text("The whole NLLR team were very", 20, 91);
  doc.text("professional in their conduct.", 23, 96);
  doc.text("I'd recommend NLLR to anybody looking for a trustworthy", 89, 91);
  doc.text("team and a high standard of workmanship", 99, 96);

  (formData.images ?? []).forEach((image) => {
    if (image.src) doc.addImage(image.src, imageFormat(image.src), image.x, image.y, image.width, image.height);
  });

  doc.text("Effective communication was key to our building", 15, 224);
  doc.text("project because we were going to be out of the UK", 13, 229);
  doc.text("while it happened, and North London Loft Rooms", 15, 234);
  doc.text("didn't disappoint.", 37, 239);
  doc.text("The conversion and quality finish also", 125, 224);
  doc.text("helped the flat to stand out", 136, 229);
  doc.text("on rightmove and enabled us to secure a", 122, 234);
  doc.text("buyer quickly.", 143, 239);

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
  doc.text(`Subtotal: ${gbpFormatter.format(totals.totalCost)}`, 20, y); y += 6;
  doc.text(`VAT (${financials.vatRate}%): ${gbpFormatter.format(totals.totalVat)}`, 20, y); y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${gbpFormatter.format(totals.grandTotal)}`, 20, y); y += 12;

  y = writeHeading(doc, "ESTABLISHING THIS QUOTE", 20, y, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = writeWrappedText(doc, text.pricingText, 20, y, 170, { lineHeight: 4.5, paragraphGap: 3.5 });

  const signature: SignatureSettings = signatureSettings ?? {
    signatoryName: companySettings.signatoryName,
    signatoryTitle: companySettings.signatoryTitle,
    companyName: companySettings.name,
    phone: companySettings.phone,
    email: "",
    imageWidth: 75,
    imageHeight: 30,
  };
  const signatureImage = signature.imageSrc ?? signatureDataUrl ?? undefined;
  y = ensureSpace(doc, y + 8, signatureImage ? signature.imageHeight + 38 : 38);
  doc.setFontSize(10);
  doc.text("On behalf of:", 20, y); y += 5;
  if (signature.signatoryName.trim()) { doc.text(signature.signatoryName, 20, y); y += 5; }
  if (signature.signatoryTitle.trim()) { doc.text(signature.signatoryTitle, 20, y); y += 5; }
  if (signature.companyName.trim()) { doc.text(signature.companyName, 20, y); y += 5; }
  if (signature.phone.trim()) { doc.text(signature.phone, 20, y); y += 5; }
  if (signature.email.trim()) { doc.text(signature.email, 20, y); y += 5; }
  if (signatureImage) doc.addImage(signatureImage, imageFormat(signatureImage), 20, y + 2, signature.imageWidth, signature.imageHeight);

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
