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

// Decisão de escopo (Fase 4, fatia essencial): este drawer NÃO tem cupom,
// NÃO calcula frete e NÃO monta mensagem de WhatsApp — o original
// (aura-maison zip) tinha os três, todos duplicando lógica que já existe
// e foi validada de verdade em /checkout (Fase 3). Aqui só lista os itens
// e manda o cliente pro checkout real.
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
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#FAF8F5] w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#E8E1D5]">
          <h2 className="font-heading text-lg font-bold text-stone-900">Sua Sacola</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-stone-500 hover:bg-stone-100" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 pb-4 border-b border-[#EAE3D6]">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-[#F2EDE4] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-stone-900 truncate">{item.product.name}</h4>
                  <p className="text-xs text-stone-500 mb-2">{formatCurrency(item.product.price)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-[#D8CCB8] rounded-full">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-stone-600 hover:text-stone-900"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-stone-600 hover:text-stone-900"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600"
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
          <div className="p-5 border-t border-[#E8E1D5] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-bold text-stone-900">{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-[11px] text-stone-400">Frete e cupom são calculados na próxima etapa.</p>
            <button
              onClick={onGoToCheckout}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold tracking-wider uppercase bg-[#1E1B18] hover:bg-[#332E29] text-[#FAF8F5]"
            >
              Ir para o Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
