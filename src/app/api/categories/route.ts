import { NextResponse } from "next/server";
import { fetchElitCategoriesAndBrands } from "@/services/elit";
import { fetchTiendanubeCategoriesAndBrands } from "@/services/tiendanube";
import { INITIAL_PRODUCTS } from "@/data/products";

export async function GET() {
  try {
    const [elitData, tiendanubeData] = await Promise.all([
      fetchElitCategoriesAndBrands().catch(() => ({ categorias: [], marcas: [] })),
      fetchTiendanubeCategoriesAndBrands().catch(() => ({ categorias: [], marcas: [] })),
    ]);

    // Local categories
    const localCatMap = new Map<string, number>();
    const localBrandSet = new Set<string>();
    for (const p of INITIAL_PRODUCTS) {
      if (p.categoryLabel) localCatMap.set(p.categoryLabel, (localCatMap.get(p.categoryLabel) || 0) + 1);
      if (p.specs?.["Marca"]) localBrandSet.add(p.specs["Marca"]);
    }

    const localCategories = Array.from(localCatMap.keys()).map((name) => ({
      nombre: name,
      uri: name.toLowerCase().replace(/\s+/g, "-"),
      supplier: "local" as const,
    }));

    const elitCategories = (elitData.categorias || []).map((c) => ({
      ...c,
      supplier: "elit" as const,
    }));

    const combinedCategories = [
      ...tiendanubeData.categorias,
      ...localCategories,
      ...elitCategories,
    ];

    const combinedBrands = Array.from(
      new Set([
        ...Array.from(localBrandSet),
        ...(tiendanubeData.marcas || []),
        ...(elitData.marcas || []),
      ])
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      categorias: combinedCategories,
      marcas: combinedBrands,
    });
  } catch (error) {
    console.error("API /api/categories error:", error);
    return NextResponse.json(
      { success: false, categorias: [], marcas: [] },
      { status: 500 }
    );
  }
}
