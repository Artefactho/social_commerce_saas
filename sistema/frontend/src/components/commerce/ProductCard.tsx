import React from "react";
import { ThemeProduct } from "@/types/theme";
import { ShoppingBag, Eye, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: ThemeProduct;
  storeSlug: string;
  onQuickView?: (product: ThemeProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeSlug,
  onQuickView,
}) => {
  const { addItem } = useCart();

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.price);

  const installmentPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.price / 12);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-card rounded-2xl border border-border/40 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider">
          {product.collection}
        </span>

        {/* Action Buttons Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => {
              addItem(
                {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  product_type: product.product_type,
                },
                storeSlug
              );
            }}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="p-2.5 bg-white text-black hover:bg-gray-100 rounded-xl shadow-lg transition-colors"
              aria-label="Espiar"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-xs md:text-sm text-foreground line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <div className="pt-1">
          <div className="text-base font-extrabold text-foreground">{formattedPrice}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            12x de {installmentPrice}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
