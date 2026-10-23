import type { jsPDF } from "jspdf";

export const PDF_MARGIN = 20;

export function getLineHeight(doc: jsPDF, multiplier = 1.15) {
  return doc.getFontSize() * 0.352777778 * multiplier;
}

export function ensureSpace(doc: jsPDF, y: number, required: number, top = PDF_MARGIN, bottom = PDF_MARGIN) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + required <= pageHeight - bottom) return y;
  doc.addPage();
  return top;
}

export function writeWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  yStart: number,
  maxWidth: number,
  options: { lineHeight?: number; paragraphGap?: number; bottomMargin?: number } = {},
) {
  const lineHeight = options.lineHeight ?? getLineHeight(doc);
  const paragraphGap = options.paragraphGap ?? lineHeight * 0.65;
  const bottomMargin = options.bottomMargin ?? PDF_MARGIN;
  let y = yStart;

  // Preserve author-entered paragraph spacing instead of flattening an entire
  // textarea into one splitTextToSize call.
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const explicitLines = paragraph.split("\n");
    explicitLines.forEach((explicitLine) => {
      const wrapped = doc.splitTextToSize(explicitLine || " ", maxWidth) as string[];
      wrapped.forEach((line) => {
        y = ensureSpace(doc, y, lineHeight, PDF_MARGIN, bottomMargin);
        doc.text(String(line), x, y);
        y += lineHeight;
      });
    });

    if (paragraphIndex < paragraphs.length - 1) {
      y = ensureSpace(doc, y, paragraphGap, PDF_MARGIN, bottomMargin);
      y += paragraphGap;
    }
  });

  return y;
}

export function writeHeading(doc: jsPDF, text: string, x: number, y: number, size = 12) {
  y = ensureSpace(doc, y, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.text(text, x, y);
  return y + getLineHeight(doc) + 2;
}
