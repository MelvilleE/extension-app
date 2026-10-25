export type QuoteType = "extension" | "loft";
export type UserRole = "user" | "admin";
export type ValueType = "unit" | "meter" | "meterage";

export interface PricingTier {
  value: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  section: string;
  baseCost: number;
  supplier: string;
  markupPercent: number;
  price: number;
  valueType: ValueType;
  isCustomPricing?: boolean;
  customPrices?: PricingTier[];
}

export interface Section {
  id: string;
  name: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  value: number;
  quantity: number;
  showQuantity: boolean;
}

export interface CoverImageSettings {
  id?: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuotationFormData {
  name: string;
  address: string;
  items: QuotationItem[];
  images?: CoverImageSettings[];
}

export interface QuoteFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedQuote {
  id: string;
  quoteType: QuoteType;
  customerName: string;
  title: string;
  revision: number;
  revisionName?: string;
  quoteGroupId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  formData: QuotationFormData;
}

export interface CompanySettings {
  name: string;
  signatoryName: string;
  signatoryTitle: string;
  phone: string;
  logoPath: string;
  signaturePath: string;
}

export interface SignatureSettings {
  signatoryName: string;
  signatoryTitle: string;
  companyName: string;
  phone: string;
  email: string;
  imageName?: string;
  imageSrc?: string;
  imageWidth: number;
  imageHeight: number;
}

export interface QuoteTypeConfig {
  id: QuoteType;
  label: string;
  pluralLabel: string;
  pageClassName: string;
  defaultBrief: string;
  defaultPricingText: string;
}

export interface QuoteTextSettings {
  briefText: string;
  pricingText: string;
  termsAndConditions: string;
}

export interface FinancialSettings {
  vatRate: number;
  commissionA: number;
  commissionB: number;
  commissionC: number;
}
