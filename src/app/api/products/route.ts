import { NextRequest, NextResponse } from "next/server";
import { fetchElitProducts } from "@/services/elit";
import { filterVisibleProducts } from "@/utils/productVisibility";

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
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const subCategoria = searchParams.get("sub_categoria") || "";
    const marca = searchParams.get("marca") || "";

    const { products, total } = await fetchElitProducts({
      limit,
      offset,
      nombre: search || undefined,
      categoria: category && category !== "todos" ? category : undefined,
      sub_categoria: subCategoria || undefined,
      marca: marca || undefined,
    });

    // Apply visibility filters on server response
    const settings = getServerSettings();
    const visibleProducts = filterVisibleProducts(products, settings);

    return NextResponse.json({
      success: true,
      products: visibleProducts,
      total: visibleProducts.length !== products.length ? visibleProducts.length : total,
      offset,
      limit,
    });
  } catch (error) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products from supplier",
        products: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
