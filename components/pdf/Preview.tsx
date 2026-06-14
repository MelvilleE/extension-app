"use client";

"use client";

import React, { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { buildSectionParagraphs } from '@/lib/pdfContent';

interface Props {
  formData: any;
  setFormData?: (data: any) => void;
  products: any[];
  sections: any[];
  logos: any[];
  images: any[];
  briefText: string;
  setBriefText?: (s: string) => void;
  extraCostsText: string;
  setExtraCostsText?: (s: string) => void;
  pricingText: string;
  setPricingText?: (s: string) => void;
  termsAndConditions: string;
  setTermsAndConditions?: (s: string) => void;
  vatRate?: number;
  CommissionA?: number;
  CommissionB?: number;
  CommissionC?: number;
  calculateProductsTotal?: () => number;
  calculateProductsVAT?: () => number;
  calculateProductsTotalWithVAT?: () => number;
  calculateTotalCost?: () => number;
  calculateTotalVAT?: () => number;
  calculateGrandTotal?: () => number;
  calculateCommissionA?: () => number;
  calculateCommissionB?: () => number;
  calculateCommissionC?: () => number;
  calculateTotalCommission?: () => number;
  calculateCommissionVAT?: () => number;
  gbpFormatter?: (v: number) => string;
  onClose: () => void;
  onSavePdf?: (meta: { id: string; title: string; createdAt: string; dataUrl: string }) => void;
  generatePdf?: () => any; // optional function from page.tsx that returns a jsPDF instance
}

// A4 px at 96dpi (approx). We'll compute a mm->px helper based on width so layout scales consistently.
const A4_PX = { width: 794, height: 1123 };
function mmToPx(mm: number) {
  // A4 width is 210mm; use the px width as baseline
  return (mm / 210) * A4_PX.width;
}

function ptToPx(pt: number) {
  // 1pt ≈ 1.333px
  return pt * 1.333333;
}

export default function PdfPreview({ formData, setFormData, products, sections, logos, images, briefText, setBriefText, extraCostsText, setExtraCostsText, pricingText, setPricingText, termsAndConditions, setTermsAndConditions, vatRate, CommissionA, CommissionB, CommissionC, calculateProductsTotal, calculateProductsVAT, calculateProductsTotalWithVAT, calculateTotalCost, calculateTotalVAT, calculateGrandTotal, calculateCommissionA, calculateCommissionB, calculateCommissionC, calculateTotalCommission, calculateCommissionVAT, gbpFormatter, onClose, onSavePdf, generatePdf }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; briefText: string; extraCostsText: string; pricingText: string; termsAndConditions: string }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [paragraphOverrides, setParagraphOverrides] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [exactPdfUrl, setExactPdfUrl] = useState<string | null>(null);
  const [showExactPdf, setShowExactPdf] = useState(false);
  const exactUrlRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const pages = containerRef.current.querySelectorAll('.pdf-page');
    setPageCount(pages.length || 1);
  }, [formData, products, sections, logos, images, briefText, extraCostsText, pricingText, termsAndConditions, paragraphOverrides]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pdfTemplates');
      if (raw) setTemplates(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  }, []);

  // Auto-generate the exact jsPDF preview when the component mounts if a generator is available.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!generatePdf) return;
      try {
        // Persist any paragraph overrides first
        if (Object.keys(paragraphOverrides).length > 0) {
          const newForm: any = { ...(formData || {}) };
          newForm.paragraphOverrides = { ...(newForm.paragraphOverrides || {}), ...paragraphOverrides };
          setFormData?.(newForm);
          await new Promise(res => setTimeout(res, 50));
        }
        const doc: any = await generatePdf();
        const blob = doc && typeof doc.output === 'function' ? doc.output('blob') : null;
        if (!blob) return;
        if (exactUrlRef.current) { try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) {} }
        const url = URL.createObjectURL(blob);
        exactUrlRef.current = url;
        if (mounted) {
          setExactPdfUrl(url);
          setShowExactPdf(true);
        }
      } catch (e) {
        console.error('Auto-generate exact PDF failed', e);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatePdf]);

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (exactUrlRef.current) {
        try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) { /* ignore */ }
        exactUrlRef.current = null;
      }
    };
  }, []);

  const saveTemplate = () => {
    const name = prompt('Template name', `Template ${new Date().toLocaleString()}`) || `Template ${Date.now()}`;
    const t = { id: `tpl-${Date.now()}`, name, briefText: briefText || '', extraCostsText: extraCostsText || '', pricingText: pricingText || '', termsAndConditions: termsAndConditions || '' };
    const updated = [t, ...templates];
    setTemplates(updated);
    try { localStorage.setItem('pdfTemplates', JSON.stringify(updated)); } catch (e) { console.error(e); }
    setSelectedTemplateId(t.id);
  };

  const loadTemplate = (id?: string) => {
    const tid = id ?? selectedTemplateId;
    if (!tid) return;
    const tpl = templates.find(t => t.id === tid);
    if (!tpl) return;
    setBriefText?.(tpl.briefText);
    setExtraCostsText?.(tpl.extraCostsText);
    setPricingText?.(tpl.pricingText);
    setTermsAndConditions?.(tpl.termsAndConditions);
    setSelectedTemplateId(tpl.id);
  };

  const exportFromPreview = async () => {
    if (!containerRef.current) return;
    const pages = Array.from(containerRef.current.querySelectorAll('.pdf-page')) as HTMLElement[];
    if (pages.length === 0) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    for (let i = 0; i < pages.length; i++) {
      const node = pages[i];
      const desiredScale = Math.min(window.devicePixelRatio || 2, 2.5);
      const canvas = await html2canvas(node, { scale: desiredScale, useCORS: true, backgroundColor: '#ffffff' });
      const maxDim = 3500;
      let finalCanvas = canvas;
      if (canvas.width > maxDim || canvas.height > maxDim) {
        const tmp = document.createElement('canvas');
        const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height);
        tmp.width = Math.round(canvas.width * scale);
        tmp.height = Math.round(canvas.height * scale);
        const ctx = tmp.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          // @ts-ignore
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        }
        finalCanvas = tmp;
      }
      const imgData = finalCanvas.toDataURL('image/jpeg', 0.94);
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    doc.save(`preview-quotation-${(formData?.name || 'customer').replace(/\s+/g, '-')}.pdf`);
    return doc;
  };

  const saveToDisk = async () => {
    const doc = await exportFromPreview();
    if (!doc) return;
    try {
      // Try File System Access API (Chromium)
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({ suggestedName: `quotation-${(formData?.name || 'customer').replace(/\s+/g, '-')}.pdf`, types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }] });
        const writable = await handle.createWritable();
        const blob = doc.output('blob');
        await writable.write(blob);
        await writable.close();
        alert('Saved to chosen file');
        return;
      }
    } catch (e) {
      console.error('File System API save failed', e);
    }

    doc.save(`preview-quotation-${(formData?.name || 'customer').replace(/\s+/g, '-')}.pdf`);
  };

  const savePdf = async () => {
    const doc = await exportFromPreview();
    if (!doc) return;
    const dataUrl = doc.output('datauristring');
    const meta = { id: `saved-${Date.now()}`, title: `Quotation - ${formData?.name || 'customer'}`, createdAt: new Date().toISOString(), dataUrl };
    onSavePdf?.(meta);
  };

  const applyEditsToQuote = () => {
    const newForm: any = { ...(formData || {}) };
    newForm.paragraphOverrides = { ...(newForm.paragraphOverrides || {}), ...paragraphOverrides };
    setFormData?.(newForm);
    alert('Edits applied to quote');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 bg-black/50">
      <div className="bg-white w-[90%] max-w-5xl rounded shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
          <div className="flex gap-2 items-center">
            <button className="btn" onClick={exportFromPreview}>Export PDF</button>
            <button className="btn" onClick={savePdf}>Save to Quotes</button>
            <button className="btn" onClick={saveToDisk}>Save to disk...</button>
            <button className="btn" onClick={() => window.print()}>Print</button>
            <div className="flex items-center gap-2">
              <select value={selectedTemplateId ?? ''} onChange={(e) => setSelectedTemplateId(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Templates</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn" onClick={() => loadTemplate()}>Load</button>
              <button className="btn" onClick={saveTemplate}>Save Template</button>
            </div>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 flex gap-2">
            <button className="btn" onClick={() => {
              setEditMode(m => {
                const next = !m;
                if (next && showExactPdf) {
                  // close exact preview when entering edit mode
                  setShowExactPdf(false);
                  if (exactUrlRef.current) { try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) {} exactUrlRef.current = null; }
                  setExactPdfUrl(null);
                }
                return next;
              });
            }}>{editMode ? 'Exit edit' : 'Edit document'}</button>
            <button className="btn" onClick={applyEditsToQuote}>Apply edits to quote</button>
            {/** Show exact jsPDF output if generator provided */}
            <button
              className="btn"
              onClick={async () => {
                if (!generatePdf) {
                  alert('Exact pdf generator not available');
                  return;
                }
                try {
                  // Ensure edits are persisted before generating
                  if (Object.keys(paragraphOverrides).length > 0) {
                    const newForm: any = { ...(formData || {}) };
                    newForm.paragraphOverrides = { ...(newForm.paragraphOverrides || {}), ...paragraphOverrides };
                    setFormData?.(newForm);
                    // small delay to allow parent state to settle
                    await new Promise(res => setTimeout(res, 50));
                  }

                  const doc: any = await generatePdf();
                  const blob = doc && typeof doc.output === 'function' ? doc.output('blob') : null;
                  if (!blob) {
                    alert('Generator did not return a PDF blob');
                    return;
                  }
                  // Revoke previous URL if any
                  if (exactUrlRef.current) {
                    try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) { /* ignore */ }
                  }
                  const url = URL.createObjectURL(blob);
                  exactUrlRef.current = url;
                  setExactPdfUrl(url);
                  setShowExactPdf(true);
                } catch (e) {
                  console.error(e);
                  alert('Failed to generate exact PDF');
                }
              }}
            >Show exact PDF</button>
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(paragraphOverrides)); alert('Copied overrides JSON to clipboard'); }}>Copy overrides</button>
          </div>

          <div ref={containerRef} className="space-y-6">
            {showExactPdf && exactPdfUrl ? (
              <div className="pdf-exact-view m-auto w-full" style={{ width: A4_PX.width }}>
                <div className="flex items-center gap-2 mb-2">
                  <button className="btn" onClick={async () => {
                    // refresh: regenerate
                    if (!generatePdf) return alert('Generator missing');
                    try {
                      if (Object.keys(paragraphOverrides).length > 0) {
                        const newForm: any = { ...(formData || {}) };
                        newForm.paragraphOverrides = { ...(newForm.paragraphOverrides || {}), ...paragraphOverrides };
                        setFormData?.(newForm);
                        await new Promise(res => setTimeout(res, 50));
                      }
                      const doc: any = await generatePdf();
                      const blob = doc && typeof doc.output === 'function' ? doc.output('blob') : null;
                      if (!blob) return alert('Generator did not return blob');
                      if (exactUrlRef.current) { try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) {} }
                      const url = URL.createObjectURL(blob);
                      exactUrlRef.current = url;
                      setExactPdfUrl(url);
                    } catch (e) { console.error(e); alert('Regenerate failed'); }
                  }}>Refresh exact PDF</button>
                  <button className="btn" onClick={() => {
                    setShowExactPdf(false);
                    if (exactUrlRef.current) { try { URL.revokeObjectURL(exactUrlRef.current); } catch (e) {} exactUrlRef.current = null; }
                    setExactPdfUrl(null);
                  }}>Close exact PDF</button>
                </div>
                <iframe title="Exact PDF" src={exactPdfUrl || undefined} style={{ width: '100%', height: 1123, border: '1px solid #ddd' }} />
              </div>
            ) : null}
            {/* Page 1 - Header & Client details */}
            <div className="pdf-page bg-white m-auto border" style={{ width: A4_PX.width, height: A4_PX.height, padding: 24, position: 'relative' as const }}>
              {/* Position logos using mm->px conversion to mirror jsPDF coordinates */}
              {logos.map((logo: any) => {
                const left = mmToPx((logo.x ?? 10));
                const top = mmToPx((logo.y ?? 10));
                const widthPx = logo.width ? mmToPx(logo.width) : undefined;
                const heightPx = logo.height ? mmToPx(logo.height) : undefined;
                const style: React.CSSProperties = { position: 'absolute', left, top };
                if (widthPx) style.width = widthPx;
                if (heightPx) style.height = heightPx;
                return (
                  <img key={logo.id} src={logo.src} alt={logo.name} style={style} />
                );
              })}

              <div style={{ textAlign: 'center', fontFamily: 'Inter, Arial, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
                <div style={{ fontSize: mmToPx(6) / 2, fontWeight: 700 }}>SMART SOLUTIONS FOR MODERN LIVING</div>
                <div style={{ marginTop: 8 }}>Working Document</div>
              </div>
                {/* Section title - mirror jsPDF: times, size 18pt, blue, centered at x=105mm, y=67mm */}
                <div style={{ position: 'absolute', left: 0, top: mmToPx(67) - ptToPx(18) / 2, width: '100%', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: ptToPx(18), color: 'rgb(0,0,255)', fontWeight: 400 }}>SMART SOLUTIONS FOR MODERN LIVING</div>
                  <div style={{ marginTop: 8, fontFamily: 'Helvetica, Arial, sans-serif', fontSize: ptToPx(11), color: '#000' }}>Working Document</div>
                  {/* Decorative underline similar to jsPDF line */}
                  <div style={{ height: 1, background: 'rgb(0,0,255)', width: mmToPx(60), margin: '6px auto 0' }} />
                </div>

              <div style={{ marginTop: mmToPx(6) / 2 }}>
                <div>
                  <strong>Client:</strong>{' '}
                  {editMode ? (
                    <input
                      className="border px-2 py-1 ml-2 rounded"
                      defaultValue={formData.name}
                      onChange={(e) => {
                        setFormData?.({ ...formData, name: e.target.value });
                      }}
                    />
                  ) : (
                    <span className="ml-2">{formData.name}</span>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                  <strong>Address:</strong>
                  <div>
                    {editMode ? (
                      <textarea
                        className="border w-full p-2 rounded mt-1"
                        defaultValue={formData.address}
                        onChange={(e) => {
                          setFormData?.({ ...formData, address: e.target.value });
                        }}
                      />
                    ) : (
                      <div className="mt-1">{formData.address}</div>
                    )}
                  </div>
                </div>
              </div>
                {/* Client details positioned using same mm coords as jsPDF: Client at x=135,y=30; Name at x=155,y=30; Address label x=135,y=42; Address at x=155,y=42 */}
                <div style={{ position: 'absolute', left: mmToPx(135), top: mmToPx(30) - ptToPx(12) / 2, fontFamily: 'Helvetica, Arial, sans-serif', fontSize: ptToPx(12) }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700 }}>Client:</div>
                    {editMode ? (
                      <input className="border px-2 py-1 rounded" defaultValue={formData.name} onChange={(e) => setFormData?.({ ...formData, name: e.target.value })} />
                    ) : (
                      <div style={{ maxWidth: mmToPx(50), whiteSpace: 'pre-wrap' }}>{formData.name}</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700 }}>Address:</div>
                    {editMode ? (
                      <textarea className="border p-2 rounded" defaultValue={formData.address} onChange={(e) => setFormData?.({ ...formData, address: e.target.value })} style={{ width: mmToPx(50), minHeight: 40 }} />
                    ) : (
                      <div style={{ maxWidth: mmToPx(50), whiteSpace: 'pre-wrap' }}>{formData.address}</div>
                    )}
                  </div>
                </div>

              <div style={{ marginTop: mmToPx(6) / 2 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Brief</h4>
                <div>
                  {editMode ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="border w-full p-2 rounded mt-1"
                      onInput={(e) => setBriefText?.((e.target as HTMLDivElement).innerText)}
                    >{briefText}</div>
                  ) : (
                    <div className="border w-full p-2 rounded mt-1" style={{ whiteSpace: 'pre-wrap' }}>{briefText}</div>
                  )}
                </div>
              </div>

            </div>

            {/* Following pages: generate paragraph-style descriptions per section, using same logic as PDF generator */}
            {(() => {
              const paragraphs = buildSectionParagraphs(sections, products, formData.items || []);
              return paragraphs.map(p => {
                const overridden = paragraphOverrides[p.sectionId] ?? p.paragraph;
                return (
                  <div key={p.sectionId} className="pdf-page bg-white m-auto border" style={{ width: A4_PX.width, height: A4_PX.height, padding: mmToPx(6) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: ptToPx(12), fontWeight: 700 }}>{p.sectionName}</h4>
                      <div>
                        <button className="btn" onClick={() => { setParagraphOverrides(prev => { const next = { ...prev }; delete next[p.sectionId]; return next; }); }}>Reset</button>
                      </div>
                    </div>
                    <div style={{ marginTop: mmToPx(2) }}>
                      {editMode ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="border w-full p-2 rounded mt-1"
                          onInput={(e) => setParagraphOverrides(prev => ({ ...prev, [p.sectionId]: (e.target as HTMLDivElement).innerHTML }))}
                          dangerouslySetInnerHTML={{ __html: overridden }}
                          style={{ minHeight: 120, fontSize: mmToPx(4) / 3 }}
                        />
                      ) : (
                        <div className="border w-full p-2 rounded mt-1" style={{ minHeight: 120, fontSize: mmToPx(4) / 3 }} dangerouslySetInnerHTML={{ __html: overridden }} />
                      )}
                    </div>
                      <div style={{ marginTop: mmToPx(2) }}>
                        {editMode ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            className="border w-full p-2 rounded mt-1"
                            onInput={(e) => setParagraphOverrides(prev => ({ ...prev, [p.sectionId]: (e.target as HTMLDivElement).innerHTML }))}
                            dangerouslySetInnerHTML={{ __html: overridden }}
                            style={{ minHeight: 120, fontSize: ptToPx(11) }}
                          />
                        ) : (
                          <div className="border w-full p-2 rounded mt-1" style={{ minHeight: 120, fontSize: ptToPx(11) }} dangerouslySetInnerHTML={{ __html: overridden }} />
                        )}
                      </div>
                  </div>
                );
              });
            })()}

            <div className="flex items-center gap-2">
              <button className="btn" onClick={applyEditsToQuote}>Apply edits to quote</button>
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(paragraphOverrides)); alert('Copied overrides JSON to clipboard'); }}>Copy overrides</button>
            </div>

            {/* Pricing summary page to replicate jsPDF output */}
            <div className="pdf-page bg-white m-auto border" style={{ width: A4_PX.width, height: A4_PX.height, padding: mmToPx(6) }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>PRICING SUMMARY</h3>
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Products Total:</span>
                  <span>{gbpFormatter?.(calculateProductsTotal?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>VAT ({vatRate}%):</span>
                  <span>{gbpFormatter?.(calculateProductsVAT?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Products + VAT:</span>
                  <span>{gbpFormatter?.(calculateProductsTotalWithVAT?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ height: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Marketing:</span>
                  <span>{gbpFormatter?.(calculateCommissionA?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Admin:</span>
                  <span>{gbpFormatter?.(calculateCommissionB?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Commission:</span>
                  <span>{gbpFormatter?.(calculateCommissionC?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8 }}>
                  <span>Total Cost (Products + Commission):</span>
                  <span>{gbpFormatter?.(calculateTotalCost?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total VAT:</span>
                  <span>{gbpFormatter?.(calculateTotalVAT?.() ?? 0) ?? ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Grand Total:</span>
                  <span>{gbpFormatter?.(calculateGrandTotal?.() ?? 0) ?? ''}</span>
                </div>
              </div>
            </div>

            {/* Extra Costs & Pricing text pages */}
            <div className="pdf-page bg-white m-auto border" style={{ width: A4_PX.width, height: A4_PX.height, padding: mmToPx(6) }}>
              <h4 style={{ fontSize: 16, fontWeight: 700 }}>Extra Costs</h4>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{extraCostsText}</div>

              <h4 style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>Establishing This Quote</h4>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{pricingText}</div>
            </div>

            <div className="pdf-page bg-white m-auto border" style={{ width: A4_PX.width, height: A4_PX.height, padding: mmToPx(6) }}>
              <h4 style={{ fontSize: 16, fontWeight: 700 }}>Terms & Conditions</h4>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{termsAndConditions}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

