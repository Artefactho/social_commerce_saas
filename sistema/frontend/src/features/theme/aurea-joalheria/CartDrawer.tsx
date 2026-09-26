import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { CartItem } from "@/hooks/useCart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  subtotal: number;
  onGoToCheckout: () => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mesma decisão de escopo do CartDrawer do Aura Maison: sem cupom, sem
// cálculo de frete e sem mensagem de WhatsApp aqui — só lista os itens e
// manda o cliente pro /checkout real, que já tem tudo isso validado.
export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  subtotal,
  onGoToCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e12] w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[rgba(229,184,105,0.16)]">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(229,184,105,0.16)]">
          <h2 className="font-heading text-lg font-bold text-white">Sua Sacola</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#8c8c9a] hover:text-[#e5b869]" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#8c8c9a]">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 pb-4 border-b border-[rgba(229,184,105,0.16)]">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-[#14141a] shrink-0 border border-[rgba(229,184,105,0.16)]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{item.product.name}</h4>
                  <p className="text-xs text-[#e5b869] mb-2">{formatCurrency(item.product.price)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-[rgba(229,184,105,0.28)] rounded-full">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-[#dedee6] hover:text-[#e5b869]"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold text-white">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-[#dedee6] hover:text-[#e5b869]"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-[#8c8c9a] hover:text-rose-400"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-[rgba(229,184,105,0.16)] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8c8c9a]">Subtotal</span>
              <span className="font-bold text-[#e5b869]">{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-[11px] text-[#8c8c9a]">Frete e cupom são calculados na próxima etapa.</p>
            <button
              onClick={onGoToCheckout}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-[0.1em] uppercase bg-[#e5b869] hover:bg-[#faebb7] text-black transition-colors"
            >
              Ir para o Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
