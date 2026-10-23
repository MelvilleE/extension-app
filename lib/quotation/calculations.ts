import type { FinancialSettings, Product, QuotationItem } from "@/types/quotation";

export function calculateItemTotal(item: QuotationItem, products: Product[]) {
  const product = products.find((candidate) => candidate.id === item.productId);
  if (!product) return 0;

  if (product.isCustomPricing && product.customPrices?.length) {
    const applicableTier = [...product.customPrices]
      .sort((a, b) => b.value - a.value)
      .find((tier) => item.value >= tier.value);

    return (applicableTier?.price ?? 0) * item.value * item.quantity;
  }

  return product.price * item.value * item.quantity;
}

export function calculateQuoteTotals(
  items: QuotationItem[],
  products: Product[],
  settings: FinancialSettings,
) {
  const productsTotal = items.reduce(
    (sum, item) => sum + calculateItemTotal(item, products),
    0,
  );

  const productsVat = (productsTotal * settings.vatRate) / 100;
  const productsTotalWithVat = productsTotal + productsVat;

  const commissionA = (productsTotalWithVat * settings.commissionA) / 100;
  const commissionB = (productsTotalWithVat * settings.commissionB) / 100;
  const commissionC = (productsTotalWithVat * settings.commissionC) / 100;
  const totalCommission = commissionA + commissionB + commissionC;
  const commissionVat = (totalCommission * settings.vatRate) / 100;

  const totalCost = productsTotal + totalCommission;
  const totalVat = productsVat + commissionVat;
  const grandTotal = totalCost + totalVat;

  return {
    productsTotal,
    productsVat,
    productsTotalWithVat,
    commissionA,
    commissionB,
    commissionC,
    totalCommission,
    commissionVat,
    totalCost,
    totalVat,
    grandTotal,
  };
}

export const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
