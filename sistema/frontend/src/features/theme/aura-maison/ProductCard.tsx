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

// Aura Maison original tinha rating, reviewsCount, badge, colors, sizes e
// stockCount vindos de mock. Nenhum desses campos existe no schema real
// (products.rating/reviewsCount/etc.) — ver PROGRESS.md "FASE 4.1". Este
// card só usa campos que realmente existem hoje: name, collection (nome da
// categoria), price, images, product_type.
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
    <div className="group relative bg-[#FAF8F5] rounded-2xl sm:rounded-3xl border border-[#E8E0D2] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-[#D1C3AD] hover:-translate-y-1">
      <div
        className="relative aspect-square w-full overflow-hidden bg-[#F2EDE4] cursor-pointer"
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
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              isWishlisted
                ? "bg-rose-50 text-rose-600 border border-rose-200 ring-2 ring-rose-300"
                : "bg-white/80 text-stone-700 hover:text-rose-600 hover:bg-white border border-white/60"
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
            className="p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 backdrop-blur-md border border-white/60 transition-all hidden sm:flex items-center justify-center"
            aria-label="Ver detalhes rápidos"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="uppercase tracking-wider text-[10px] font-semibold text-amber-800">
            {product.collection}
          </span>
          <h3
            onClick={() => onQuickView(product)}
            className="font-heading text-base sm:text-lg font-bold text-stone-900 leading-snug line-clamp-2 cursor-pointer hover:text-amber-800 transition-colors mt-1 mb-2"
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-3 border-t border-[#EAE3D6] mt-3">
          <div className="mb-3">
            <span className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddClick}
            className={`w-full py-2.5 px-4 rounded-xl sm:rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              addedAnimation
                ? "bg-emerald-700 text-white"
                : "bg-[#1E1B18] hover:bg-[#332E29] text-[#FAF8F5] active:scale-[0.98]"
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Adicionado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                <span>Adicionar ao Carrinho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
