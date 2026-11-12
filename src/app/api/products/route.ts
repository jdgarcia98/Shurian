import { NextRequest, NextResponse } from "next/server";
import { fetchElitProducts } from "@/services/elit";
import { fetchTiendanubeProducts } from "@/services/tiendanube";
import { filterVisibleProducts } from "@/utils/productVisibility";
import { Product } from "@/types";

// Global cache or fallback reader helper
function getServerSettings() {
  try {
    if (globalThis.__shurianSettings) {
      return globalThis.__shurianSettings;
    }
  } catch (e) {}
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const category = searchParams.get("category") || "";
    const subCategoria = searchParams.get("sub_categoria") || "";
    const marca = (searchParams.get("marca") || "").trim().toLowerCase();
    const supplier = searchParams.get("supplier") || ""; // "elit" | "tiendanube" | ""

    // 1. Fetch Tiendanube products (if not restricted to elit only)
    let tiendanubeProducts: Product[] = [];
    if (supplier !== "elit") {
      try {
        const allTn = await fetchTiendanubeProducts();
        tiendanubeProducts = allTn.filter((p) => {
          if (category && category !== "todos" && p.category !== category) return false;
          if (search && !p.name.toLowerCase().includes(search) && !p.description.toLowerCase().includes(search)) return false;
          if (marca && !(p.specs?.["Marca"]?.toLowerCase().includes(marca))) return false;
          return true;
        });
      } catch (err) {
        console.warn("[API /api/products] Tiendanube fetch failed gracefully:", err);
      }
    }

    // 2. Fetch Elit products (if not restricted to tiendanube only)
    let elitProducts: Product[] = [];
    let elitTotal = 0;
    if (supplier !== "tiendanube") {
      try {
        const elitRes = await fetchElitProducts({
          limit,
          offset,
          nombre: search || undefined,
          categoria: category && category !== "todos" ? category : undefined,
          sub_categoria: subCategoria || undefined,
          marca: marca || undefined,
        });
        elitProducts = elitRes.products;
        elitTotal = elitRes.total;
      } catch (err) {
        console.warn("[API /api/products] Elit fetch failed gracefully:", err);
      }
    }

    // 3. Combine products: Tiendanube products (Local store / immediate stock) first, then Elit
    const combinedProducts: Product[] = [...tiendanubeProducts, ...elitProducts];

    // 4. Apply visibility filters (out of stock, hidden categories, brands, etc.)
    const settings = getServerSettings();
    const visibleProducts = filterVisibleProducts(combinedProducts, settings);

    const totalCombined = visibleProducts.length !== combinedProducts.length
      ? visibleProducts.length
      : tiendanubeProducts.length + elitTotal;

    return NextResponse.json({
      success: true,
      products: visibleProducts,
      total: totalCombined,
      tiendanubeCount: tiendanubeProducts.length,
      elitCount: elitProducts.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        products: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
