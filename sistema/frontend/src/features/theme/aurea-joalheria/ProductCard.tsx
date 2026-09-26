import { useState } from "react";
import { ShoppingBag, Heart, Eye, Check } from "lucide-react";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onQuickView: (product: Product) => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mesma decisão do ProductCard do Aura Maison: só usa campos que existem de
// verdade no schema (name, collection, price, images, product_type) — sem
// rating/reviewsCount/badge/variantes (não existem em products). O selo
// decorativo do template de referência ("Diamante Certificado" etc.) não foi
// trazido por ser texto fixo sem correspondência em dado real; a categoria
// real da loja já cumpre o mesmo papel de rótulo acima do nome.
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onQuickView,
}) => {
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  return (
    <div className="group relative bg-[#14141a] rounded-2xl border border-[rgba(229,184,105,0.16)] p-4 flex flex-col transition-all duration-300 hover:border-[#e5b869] hover:-translate-y-1.5">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl mb-5 cursor-pointer border border-[rgba(229,184,105,0.16)]"
        style={{ background: "radial-gradient(circle, #1a1a22 0%, #08080a 100%)" }}
        onClick={() => onQuickView(product)}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-all duration-500 transform group-hover:scale-105"
        />

        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all border ${
              isWishlisted
                ? "bg-black/70 text-rose-400 border-rose-400"
                : "bg-black/50 text-[#e5b869] border-[rgba(229,184,105,0.28)] hover:border-[#e5b869]"
            }`}
            aria-label="Favoritar produto"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2 rounded-full bg-black/50 text-[#e5b869] border border-[rgba(229,184,105,0.28)] hover:border-[#e5b869] backdrop-blur-md transition-all hidden sm:flex items-center justify-center"
            aria-label="Ver detalhes rápidos"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="uppercase tracking-[0.15em] text-[10px] font-semibold text-[#e5b869]">
            {product.collection}
          </span>
          <h3
            onClick={() => onQuickView(product)}
            className="font-heading text-base sm:text-lg font-bold text-white leading-snug line-clamp-2 cursor-pointer hover:text-[#e5b869] transition-colors mt-1 mb-3"
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-3 border-t border-[rgba(229,184,105,0.16)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider text-[#8c8c9a]">Valor</span>
            <span className="text-base sm:text-lg font-bold text-[#e5b869]">{formatCurrency(product.price)}</span>
          </div>

          <button
            onClick={handleAddClick}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold tracking-[0.1em] uppercase transition-all duration-200 flex items-center justify-center gap-2 border ${
              addedAnimation
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-transparent text-white border-[#e5b869] hover:bg-[#e5b869] hover:text-black"
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Adicionar ao Carrinho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
