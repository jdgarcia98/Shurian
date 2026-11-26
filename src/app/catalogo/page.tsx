import React from "react";
import { Metadata } from "next";
import { Catalog } from "@/components/Catalog";
import { fetchElitProducts, fetchElitCategoriesAndBrands } from "@/services/elit";
import { fetchTiendanubeProducts, fetchTiendanubeCategoriesAndBrands } from "@/services/tiendanube";
import { INITIAL_PRODUCTS } from "@/data/products";

export const metadata: Metadata = {
  title: "Catálogo de Productos y Accesorios | SHURIAN Rosario",
  description:
    "Explora nuestro catálogo de informática, componentes, periféricos y accesorios en Rosario con garantía oficial.",
};

// Revalidate page data every 60 seconds
export const revalidate = 60;

export default async function CatalogoPage() {
  const [
    tiendanubeProducts,
    tiendanubeCategoriesData,
    { products: elitProducts, total: elitTotal },
    elitCategoriesData,
  ] = await Promise.all([
    fetchTiendanubeProducts().catch(() => []),
    fetchTiendanubeCategoriesAndBrands().catch(() => ({ categorias: [], marcas: [] })),
    fetchElitProducts({ limit: 40 }).catch(() => ({ products: [], total: 0 })),
    fetchElitCategoriesAndBrands().catch(() => ({ categorias: [], marcas: [] })),
  ]);

  // Merge Tiendanube store products, local curated store products, and Elit catalog
  const combinedProducts = [...tiendanubeProducts, ...INITIAL_PRODUCTS, ...elitProducts];
  const combinedTotal = tiendanubeProducts.length + elitTotal + INITIAL_PRODUCTS.length;
  const combinedBrands = Array.from(
    new Set([
      ...(tiendanubeCategoriesData.marcas || []),
      ...(elitCategoriesData.marcas || []),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const seenCats = new Set<string>();
  const combinedCategories = [
    ...(tiendanubeCategoriesData.categorias || []).map((c) => ({
      nombre: c.nombre,
      uri: `tn-${c.uri}`,
      sub_categorias: [],
    })),
    ...(elitCategoriesData.categorias || []),
  ].filter((c) => {
    const key = c.nombre.trim().toLowerCase();
    if (seenCats.has(key)) return false;
    seenCats.add(key);
    return true;
  });

  return (
    <div className="pt-52 sm:pt-56 md:pt-32 pb-16 bg-white min-h-screen">
      <Catalog
        initialProducts={combinedProducts}
        initialTotal={combinedTotal}
        availableBrands={combinedBrands}
        availableCategories={combinedCategories}
      />
    </div>
  );
}
