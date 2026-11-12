import { Product, ProductCategory } from "@/types";

export interface TiendanubeVariantRaw {
  id: number;
  product_id: number;
  price: string | number;
  promotional_price?: string | number | null;
  stock: number | null; // null means infinite stock in Tiendanube
  sku?: string | null;
  barcode?: string | null;
  values?: Array<{ es?: string; [key: string]: string | undefined } | string>;
}

export interface TiendanubeImageRaw {
  id: number;
  src: string;
  position: number;
  alt?: string[] | string;
}

export interface TiendanubeCategoryRaw {
  id: number;
  name: { es?: string; [key: string]: string | undefined } | string;
  description?: { es?: string; [key: string]: string | undefined } | string;
  handle?: { es?: string; [key: string]: string | undefined } | string;
}

export interface TiendanubeProductRaw {
  id: number;
  name: { es?: string; [key: string]: string | undefined } | string;
  description?: { es?: string; [key: string]: string | undefined } | string;
  handle?: { es?: string; [key: string]: string | undefined } | string;
  variants?: TiendanubeVariantRaw[];
  images?: TiendanubeImageRaw[];
  categories?: TiendanubeCategoryRaw[];
  brand?: string | null;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

function getText(field: { es?: string; [key: string]: string | undefined } | string | undefined | null): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.es || Object.values(field)[0] || "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
}

// Map Tiendanube categories or product name to Shurian ProductCategory
export function mapTiendanubeCategory(categories?: TiendanubeCategoryRaw[], productName: string = ""): {
  category: ProductCategory;
  label: string;
} {
  const catNames = (categories || []).map((c) => getText(c.name).toLowerCase()).join(" ");
  const lower = `${catNames} ${productName.toLowerCase()}`;

  if (lower.includes("celular") || lower.includes("smartphone") || lower.includes("telefono") || lower.includes("iphone")) {
    return { category: "celulares", label: "Celulares & Telefonía" };
  }
  if (lower.includes("funda") || lower.includes("vidrio") || lower.includes("templado") || lower.includes("hydrogel") || lower.includes("estuche")) {
    return { category: "fundas-vidrios", label: "Fundas & Vidrios" };
  }
  if (lower.includes("cable") || lower.includes("cargador") || lower.includes("power bank") || lower.includes("fuente") || lower.includes("adaptador")) {
    return { category: "cables-cargadores", label: "Cables & Cargadores" };
  }
  if (lower.includes("audio") || lower.includes("auricular") || lower.includes("parlante") || lower.includes("soundbar") || lower.includes("headset") || lower.includes("microfono")) {
    return { category: "audio", label: "Audio & Parlantes" };
  }
  if (lower.includes("notebook") || lower.includes("laptop") || lower.includes("computadora") || lower.includes("aio") || lower.includes("all in one") || lower.includes("pc")) {
    return { category: "notebooks-pc", label: "Notebooks & PC" };
  }
  if (lower.includes("reparacion") || lower.includes("servicio tecnico") || lower.includes("modulo") || lower.includes("pantalla") || lower.includes("bateria")) {
    return { category: "servicio-tecnico", label: "Servicio Técnico & Repuestos" };
  }

  const primaryCatName = categories && categories.length > 0 ? getText(categories[0].name) : "Accesorios & Tecnología";
  return { category: "perifericos", label: primaryCatName };
}

// Transform raw Tiendanube product to Shurian Product
export function transformTiendanubeProduct(raw: TiendanubeProductRaw): Product {
  const name = getText(raw.name);
  const rawDesc = getText(raw.description);
  const description = stripHtml(rawDesc) || `${name} - Disponible en Shurian.`;
  const { category, label } = mapTiendanubeCategory(raw.categories, name);

  // Take primary variant
  const primaryVariant = raw.variants && raw.variants.length > 0 ? raw.variants[0] : undefined;

  let price = 0;
  let originalPrice: number | undefined = undefined;

  if (primaryVariant) {
    const normalPrice = Math.round(Number(primaryVariant.price) || 0);
    const promoPrice = primaryVariant.promotional_price ? Math.round(Number(primaryVariant.promotional_price)) : null;

    if (promoPrice && promoPrice > 0 && promoPrice < normalPrice) {
      price = promoPrice;
      originalPrice = normalPrice;
    } else {
      price = normalPrice;
    }
  }

  // Stock logic: null in Tiendanube means unlimited stock
  const hasInfiniteStock = primaryVariant?.stock === null || primaryVariant?.stock === undefined;
  const stockCount = hasInfiniteStock ? 99 : (primaryVariant?.stock || 0);
  const inStock = hasInfiniteStock || stockCount > 0;

  // Images: sort by position
  const sortedImages = (raw.images || []).slice().sort((a, b) => a.position - b.position);
  const image =
    sortedImages.length > 0
      ? sortedImages[0].src
      : "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop";

  // Specs & Features
  const specs: Record<string, string> = {};
  if (raw.brand) specs["Marca"] = raw.brand;
  if (primaryVariant?.sku) specs["SKU"] = primaryVariant.sku;
  if (primaryVariant?.barcode) specs["Código de Barras"] = primaryVariant.barcode;

  const features: string[] = [];
  features.push("Stock disponible en local (Entrega Inmediata)");
  if (raw.brand) features.push(`Marca: ${raw.brand}`);
  if (originalPrice && originalPrice > price) {
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    features.push(`${discount}% de descuento aplicado`);
  }

  // Badge
  let badge: "NUEVO" | "OFERTA" | "MÁS VENDIDO" | "EXPRESS" | undefined = undefined;
  if (originalPrice && originalPrice > price) {
    badge = "OFERTA";
  } else if (raw.created_at) {
    const createdDaysAgo = (Date.now() - new Date(raw.created_at).getTime()) / (1000 * 3600 * 24);
    if (createdDaysAgo < 30) badge = "NUEVO";
  }

  return {
    id: `tiendanube-${raw.id}`,
    name,
    category,
    categoryLabel: label,
    description,
    price,
    originalPrice,
    image,
    inStock,
    stockCount,
    badge,
    features: features.length > 0 ? features : undefined,
    specs: Object.keys(specs).length > 0 ? specs : undefined,
    warranty: "Garantía oficial en local Shurian",
    supplier: "tiendanube",
  };
}

// In-memory cache
interface TiendanubeCache {
  products: Product[];
  timestamp: number;
}

let memoryCache: TiendanubeCache | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

export function clearTiendanubeCache(): void {
  memoryCache = null;
}

export interface FetchTiendanubeParams {
  forceRefresh?: boolean;
}

export function getTiendanubeCredentials(): { storeId?: string; accessToken?: string; userAgent: string } {
  let storeId = process.env.TIENDANUBE_STORE_ID;
  let accessToken = process.env.TIENDANUBE_ACCESS_TOKEN;

  if ((!storeId || !accessToken) && (globalThis as any).__shurianSettings) {
    const s = (globalThis as any).__shurianSettings;
    storeId = storeId || s.tiendanubeStoreId;
    accessToken = accessToken || s.tiendanubeAccessToken;
  }

  if (!storeId || !accessToken) {
    try {
      const fs = require("fs");
      const path = require("path");
      const tmpPath = path.join("/tmp", "shurian_tiendanube.json");
      if (fs.existsSync(tmpPath)) {
        const data = JSON.parse(fs.readFileSync(tmpPath, "utf-8"));
        storeId = storeId || String(data.storeId);
        accessToken = accessToken || data.accessToken;
      }
    } catch (e) {}
  }

  return {
    storeId: storeId ? String(storeId).trim() : undefined,
    accessToken: accessToken ? String(accessToken).trim() : undefined,
    userAgent: process.env.TIENDANUBE_USER_AGENT || "Shurian (contacto@shurian.com.ar)",
  };
}

export async function fetchTiendanubeProducts(
  params: FetchTiendanubeParams = {}
): Promise<Product[]> {
  const { storeId, accessToken, userAgent } = getTiendanubeCredentials();

  // If not configured, gracefully return empty array
  if (!storeId || !accessToken) {
    return [];
  }

  const now = Date.now();
  if (!params.forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.products;
  }

  try {
    const allProducts: Product[] = [];
    let page = 1;
    let hasMore = true;

    // Fetch pages (up to 200 per page)
    while (hasMore && page <= 5) { // safety limit to 1000 products
      const url = `https://api.tiendanube.com/v1/${storeId}/products?per_page=200&page=${page}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authentication: `bearer ${accessToken}`,
          "User-Agent": userAgent,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`[Tiendanube] Failed to fetch page ${page}: ${res.status} ${res.statusText}`);
        break;
      }

      const rawList: TiendanubeProductRaw[] = await res.json();
      if (!Array.isArray(rawList) || rawList.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of rawList) {
        // Only include published items (or all if desired)
        if (item.published !== false) {
          allProducts.push(transformTiendanubeProduct(item));
        }
      }

      if (rawList.length < 200) {
        hasMore = false;
      } else {
        page++;
      }
    }

    memoryCache = {
      products: allProducts,
      timestamp: now,
    };

    return allProducts;
  } catch (error) {
    console.error("[Tiendanube] Error fetching products:", error);
    return memoryCache ? memoryCache.products : [];
  }
}

export async function fetchTiendanubeCategoriesAndBrands(): Promise<{
  categorias: { nombre: string; uri: string; supplier: "tiendanube" }[];
  marcas: string[];
}> {
  try {
    const products = await fetchTiendanubeProducts();
    const catMap = new Map<string, number>();
    const brandSet = new Set<string>();

    for (const p of products) {
      if (p.categoryLabel) {
        catMap.set(p.categoryLabel, (catMap.get(p.categoryLabel) || 0) + 1);
      }
      if (p.specs?.["Marca"]) {
        brandSet.add(p.specs["Marca"].trim());
      }
    }

    return {
      categorias: Array.from(catMap.keys()).map((c) => ({
        nombre: c,
        uri: c.toLowerCase().replace(/\s+/g, "-"),
        supplier: "tiendanube",
      })),
      marcas: Array.from(brandSet),
    };
  } catch (e) {
    return { categorias: [], marcas: [] };
  }
}
