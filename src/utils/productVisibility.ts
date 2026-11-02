import { Product } from "@/types";
import { BusinessSettings } from "@/store/useAdminStore";

export function shouldShowProduct(
  product: Product,
  settings: Partial<BusinessSettings> | undefined
): boolean {
  if (!settings) return true;

  // 1. Hide out of stock if configured
  if (settings.hideOutOfStock && !product.inStock) {
    return false;
  }

  // 2. Supplier filter
  const isElit = product.id.startsWith("elit-") || product.supplier === "elit";
  const isLocal = !isElit || product.supplier === "local";

  if (isElit && settings.hideElitSupplier) {
    return false;
  }
  if (isLocal && settings.hideLocalSupplier) {
    return false;
  }

  // 3. Hidden products by ID
  if (settings.hiddenProductIds && settings.hiddenProductIds.includes(product.id)) {
    return false;
  }

  // 4. Hidden brands
  const brand = (product.specs?.["Marca"] || "").trim().toUpperCase();
  if (
    brand &&
    settings.hiddenBrands &&
    settings.hiddenBrands.some((b) => b.trim().toUpperCase() === brand)
  ) {
    return false;
  }

  // 5. Hidden categories (by internal id or label match)
  if (settings.hiddenCategories && settings.hiddenCategories.length > 0) {
    const catLower = (product.category || "").toLowerCase();
    const labelLower = (product.categoryLabel || "").toLowerCase();
    const isHiddenCat = settings.hiddenCategories.some((cat) => {
      const c = cat.toLowerCase();
      return catLower === c || labelLower.includes(c);
    });
    if (isHiddenCat) return false;
  }

  return true;
}

export function filterVisibleProducts(
  products: Product[],
  settings: Partial<BusinessSettings> | undefined
): Product[] {
  if (!settings) return products;
  return products.filter((p) => shouldShowProduct(p, settings));
}
