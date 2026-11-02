"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { useAdminStore } from "@/store/useAdminStore";
import { filterVisibleProducts } from "@/utils/productVisibility";

interface HomeFeaturedProductsProps {
  initialProducts: Product[];
}

export const HomeFeaturedProducts: React.FC<HomeFeaturedProductsProps> = ({
  initialProducts,
}) => {
  const { settings, fetchSettings } = useAdminStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  const visibleProducts = mounted
    ? filterVisibleProducts(initialProducts, settings).slice(0, 8)
    : initialProducts.slice(0, 8);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
