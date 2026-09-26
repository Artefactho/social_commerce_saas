import { X, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Product } from "@/data/products";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose, items, onRemove, onMoveToCart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e12] w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[rgba(229,184,105,0.16)]">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(229,184,105,0.16)]">
          <h2 className="font-heading text-lg font-bold text-white">Favoritos</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#8c8c9a] hover:text-[#e5b869]" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#8c8c9a]">
              <Heart className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">Você ainda não salvou nenhum produto.</p>
            </div>
          ) : (
            items.map((product) => (
              <div key={product.id} className="flex gap-3 pb-4 border-b border-[rgba(229,184,105,0.16)]">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-[#14141a] shrink-0 border border-[rgba(229,184,105,0.16)]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
                  <p className="text-xs text-[#e5b869] mb-2">{formatCurrency(product.price)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onMoveToCart(product)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold bg-[#e5b869] text-black px-3 py-1.5 rounded-full"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      Mover pra sacola
                    </button>
                    <button
                      onClick={() => onRemove(product)}
                      className="p-1.5 text-[#8c8c9a] hover:text-rose-400"
                      aria-label="Remover dos favoritos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
