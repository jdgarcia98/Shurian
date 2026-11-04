"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { formatARS } from "@/utils/currency";
import { generateProductInquiryWhatsAppUrl } from "@/utils/whatsapp";
import {
  X,
  ShoppingCart,
  Check,
  ShieldCheck,
  MessageCircle,
  Plus,
  Minus,
} from "lucide-react";

export const ProductModal: React.FC = () => {
  const {
    selectedProductForQuickView,
    setSelectedProductForQuickView,
    addItem,
  } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
  }, [selectedProductForQuickView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProductForQuickView(null);
      }
    };

    if (selectedProductForQuickView) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProductForQuickView, setSelectedProductForQuickView]);

  if (!selectedProductForQuickView) return null;

  const product = selectedProductForQuickView;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelectedProductForQuickView(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex min-h-full items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={() => setSelectedProductForQuickView(null)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] flex flex-col rounded-3xl bg-white border border-zinc-200 shadow-2xl z-10 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-zinc-900">
        
        {/* Floating Close button */}
        <button
          onClick={() => setSelectedProductForQuickView(null)}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full bg-zinc-100/90 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 backdrop-blur transition-all z-30 shadow-sm"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-5 sm:p-8 overscroll-contain flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            
            {/* Left: Product Image */}
            <div className="md:sticky md:top-0 space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200 aspect-square flex items-center justify-center p-4 max-h-[380px] w-full">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain object-center"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 text-xs font-mono font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="flex flex-col">
              {/* Category */}
              <div className="flex items-center gap-2 mb-2 pr-10">
                <span className="text-xs font-mono text-orange-600 font-bold uppercase tracking-wider">
                  {product.categoryLabel}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  • {product.inStock ? "Stock en Bv. Segui 1501" : "Consultar stock"}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-headline font-black text-xl sm:text-2xl text-zinc-950 mb-3 leading-snug">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-zinc-100">
                <span className="font-mono font-black text-2xl sm:text-3xl text-zinc-950">
                  {formatARS(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-zinc-400 line-through font-mono">
                    {formatARS(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Actions: Quantity + Add to cart + WhatsApp */}
              <div className="space-y-3 mb-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full bg-white border border-zinc-200 p-1 shadow-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-zinc-950">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-6 rounded-full font-headline font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                      added
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-950 hover:bg-orange-500 text-white active:scale-95"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-orange-400" />
                        <span>Agregar {quantity > 1 ? `(${quantity})` : ""}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* WhatsApp direct consult button */}
                <a
                  href={generateProductInquiryWhatsAppUrl(product.name, product.price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar disponibilidad por WhatsApp</span>
                </a>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">
                    Descripción:
                  </h4>
                  <p className="font-body text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features List */}
              {product.features && product.features.length > 0 && (
                <div className="mb-5 space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Destacados:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-700">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs Grid */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
                    Especificaciones técnicas:
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 divide-y divide-zinc-200/50 text-xs">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-2 first:pt-1 last:pb-1 gap-4">
                        <span className="text-zinc-500 shrink-0">{key}:</span>
                        <span className="text-zinc-900 font-mono font-semibold text-right break-words">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warranty */}
              {product.warranty && (
                <div className="flex items-center gap-2 text-xs text-zinc-600 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{product.warranty}</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
