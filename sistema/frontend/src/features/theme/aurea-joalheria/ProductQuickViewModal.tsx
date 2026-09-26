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

// Mesma decisão de escopo do Aura Maison: sem simulador de frete por CEP,
// sem link direto de WhatsApp (dependem de dados que não existem no schema),
// sem seletor de cor/tamanho (schema não tem variantes) e sem estrelas de
// avaliação (schema não tem rating).
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e12] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[rgba(229,184,105,0.16)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 border border-[rgba(229,184,105,0.28)] hover:border-[#e5b869] text-[#e5b869]"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div
            className="aspect-square"
            style={{ background: "radial-gradient(circle, #1a1a22 0%, #08080a 100%)" }}
          >
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 sm:p-8 flex flex-col">
            <span className="uppercase tracking-[0.15em] text-[10px] font-semibold text-[#e5b869]">
              {product.collection}
            </span>
            <h2 className="font-heading text-2xl font-bold text-white mt-1 mb-2">{product.name}</h2>
            <p className="text-sm text-[#8c8c9a] leading-relaxed mb-4 flex-1">{product.description}</p>

            <span className="text-2xl font-bold text-[#e5b869] mb-4">{formatCurrency(product.price)}</span>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-[rgba(229,184,105,0.28)] rounded-full">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-[#dedee6] hover:text-[#e5b869]"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="p-2 text-[#dedee6] hover:text-[#e5b869]"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-2.5 rounded-full border transition-all ${
                  isWishlisted
                    ? "bg-black/50 text-rose-400 border-rose-400"
                    : "bg-black/30 text-[#dedee6] hover:text-[#e5b869] border-[rgba(229,184,105,0.28)]"
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
              className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-[0.1em] uppercase border border-[#e5b869] text-white hover:bg-[#e5b869] hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Adicionar ao Carrinho</span>
            </button>

            <p className="text-[11px] text-[#8c8c9a] mt-3 text-center">
              Frete e forma de pagamento são calculados no checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
