import type {
  CoverImageSettings,
  FinancialSettings,
  Product,
  QuoteFolder,
  QuoteTextSettings,
  QuoteType,
  SavedQuote,
  Section,
  SignatureSettings,
} from "@/types/quotation";

const PREFIX = "quotation";
const FOLDERS_KEY = `${PREFIX}:folders`;
const SIGNATURE_KEY = `${PREFIX}:companySignature`;

export const storageKeys = (type: QuoteType) => ({
  sections: `${PREFIX}:${type}:sections`,
  products: `${PREFIX}:${type}:products`,
  quotes: `${PREFIX}:${type}:savedQuotes`,
  text: `${PREFIX}:${type}:textSections`,
  financials: `${PREFIX}:${type}:financials`,
  logos: `${PREFIX}:${type}:logos`,
  // Kept only so preview data created during the refactor is not orphaned.
  coverImage: `${PREFIX}:${type}:coverImage`,
});

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSections(type: QuoteType) {
  return readJson<Section[]>(storageKeys(type).sections);
}

export function saveSections(type: QuoteType, value: Section[]) {
  writeJson(storageKeys(type).sections, value);
}

export function loadProducts(type: QuoteType) {
  return readJson<Product[]>(storageKeys(type).products);
}

export function saveProducts(type: QuoteType, value: Product[]) {
  writeJson(storageKeys(type).products, value);
}

export function loadQuotes(type: QuoteType) {
  return readJson<SavedQuote[]>(storageKeys(type).quotes) ?? [];
}

export function saveQuotes(type: QuoteType, value: SavedQuote[]) {
  writeJson(storageKeys(type).quotes, value);
}

export function loadFolders() {
  return readJson<QuoteFolder[]>(FOLDERS_KEY) ?? [];
}

export function saveFolders(value: QuoteFolder[]) {
  writeJson(FOLDERS_KEY, value);
}

export function loadTextSettings(type: QuoteType) {
  return readJson<QuoteTextSettings>(storageKeys(type).text);
}

export function saveTextSettings(type: QuoteType, value: QuoteTextSettings) {
  writeJson(storageKeys(type).text, value);
}

export function loadFinancialSettings(type: QuoteType) {
  return readJson<FinancialSettings>(storageKeys(type).financials);
}

export function saveFinancialSettings(type: QuoteType, value: FinancialSettings) {
  writeJson(storageKeys(type).financials, value);
}

export function loadLogos(type: QuoteType) {
  return readJson<CoverImageSettings[]>(storageKeys(type).logos) ?? [];
}

export function saveLogos(type: QuoteType, value: CoverImageSettings[]) {
  writeJson(storageKeys(type).logos, value);
}

export function loadSignatureSettings() {
  return readJson<SignatureSettings>(SIGNATURE_KEY);
}

export function saveSignatureSettings(value: SignatureSettings) {
  writeJson(SIGNATURE_KEY, value);
}

export function loadCoverImage(type: QuoteType) {
  return readJson<CoverImageSettings>(storageKeys(type).coverImage);
}

export function saveCoverImage(type: QuoteType, value: CoverImageSettings | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(storageKeys(type).coverImage);
    return;
  }
  writeJson(storageKeys(type).coverImage, value);
}

export interface LegacyLocalStorageExport {
  quotationSections?: Section[] | string;
  quotationProducts?: Product[] | string;
  savedQuotes?: Array<Partial<SavedQuote>> | string;
  "quotation-text-sections"?: QuoteTextSettings | string;
  vatRate?: number | string;
  CommissionA?: number | string;
  CommissionB?: number | string;
  CommissionC?: number | string;
  [key: string]: unknown;
}

function normaliseLegacyValue<T>(value: T | string | undefined): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

function legacyGroupId(type: QuoteType, customerName: string, address: string) {
  const identity = `${customerName}-${address}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${type}:${identity || "untitled"}`;
}

/** Import an export from either original app into namespaced unified storage. */
export function importLegacyExport(type: QuoteType, exported: LegacyLocalStorageExport) {
  const sections = normaliseLegacyValue<Section[]>(exported.quotationSections);
  const products = normaliseLegacyValue<Product[]>(exported.quotationProducts);
  const text = normaliseLegacyValue<QuoteTextSettings>(exported["quotation-text-sections"]);
  const legacyQuotes = normaliseLegacyValue<Array<Partial<SavedQuote>>>(exported.savedQuotes) ?? [];

  if (sections) saveSections(type, sections);
  if (products) saveProducts(type, products);
  if (text) saveTextSettings(type, text);

  const migratedQuotes: SavedQuote[] = legacyQuotes.map((quote, index) => {
    const id = quote.id ?? `legacy-${type}-${Date.now()}-${index}`;
    const revision = quote.revision ?? 1;
    const customerName = quote.customerName ?? quote.formData?.name ?? "Untitled client";
    const address = quote.formData?.address ?? "";
    return {
      id,
      quoteType: type,
      quoteGroupId: quote.quoteGroupId ?? legacyGroupId(type, customerName, address),
      customerName,
      title: quote.title ?? `${customerName} - Rev ${revision}`,
      revision,
      revisionName: quote.revisionName,
      folderId: quote.folderId,
      createdAt: quote.createdAt ?? new Date().toISOString(),
      updatedAt: quote.updatedAt ?? quote.createdAt ?? new Date().toISOString(),
      formData: quote.formData ?? { name: customerName, address: "", items: [], images: [] },
    };
  });

  if (migratedQuotes.length) saveQuotes(type, migratedQuotes);

  const financials: FinancialSettings = {
    vatRate: Number(exported.vatRate ?? 20),
    commissionA: Number(exported.CommissionA ?? 0.5),
    commissionB: Number(exported.CommissionB ?? 1),
    commissionC: Number(exported.CommissionC ?? 2.5),
  };
  saveFinancialSettings(type, financials);

  return {
    sections: sections?.length ?? 0,
    products: products?.length ?? 0,
    quotes: migratedQuotes.length,
  };
}
