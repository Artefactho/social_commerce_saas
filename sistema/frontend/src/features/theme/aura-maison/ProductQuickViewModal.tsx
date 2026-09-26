import { useState, useEffect } from "react";
import { X, ShoppingBag, Heart, Minus, Plus } from "lucide-react";
import { Product } from "@/data/products";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Renomeado de ProductModal.tsx (original) para não colidir com
// src/components/ProductModal.tsx (modal de CRUD de produto do Dashboard).
// Removidos do original: simulador de frete por CEP e link direto de
// WhatsApp (dependem de dados que não existem no schema ainda — ver
// PROGRESS.md "FASE 4.1"), seletor de cor/tamanho (schema não tem
// variantes de produto) e estrelas de avaliação (schema não tem rating).
export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#FAF8F5] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="aspect-square bg-[#F2EDE4]">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 sm:p-8 flex flex-col">
            <span className="uppercase tracking-wider text-[10px] font-semibold text-amber-800">
              {product.collection}
            </span>
            <h2 className="font-heading text-2xl font-bold text-stone-900 mt-1 mb-2">{product.name}</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-4 flex-1">{product.description}</p>

            <span className="text-2xl font-extrabold text-stone-900 mb-4">{formatCurrency(product.price)}</span>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-[#D8CCB8] rounded-full">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-stone-600 hover:text-stone-900"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="p-2 text-stone-600 hover:text-stone-900"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-2.5 rounded-full border transition-all ${
                  isWishlisted
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-white text-stone-700 hover:text-rose-600 border-stone-200"
                }`}
                aria-label="Favoritar produto"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            <button
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold tracking-wider uppercase bg-[#1E1B18] hover:bg-[#332E29] text-[#FAF8F5] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
              <span>Adicionar ao Carrinho</span>
            </button>

            <p className="text-[11px] text-stone-400 mt-3 text-center">
              Frete e forma de pagamento são calculados no checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
