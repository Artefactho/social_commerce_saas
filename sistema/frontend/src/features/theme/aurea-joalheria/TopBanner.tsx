import { useState, useEffect } from "react";
import { Truck, ShieldCheck, Sparkles, X } from "lucide-react";

// Mesma decisão de escopo do Aura Maison (ver TopBanner.tsx de lá): mensagens
// genéricas, sem valores/promessas específicas (frete grátis, cupom, etc.)
// porque a loja ainda não tem esses dados configuráveis no schema.
const ANNOUNCEMENTS = [
  { icon: Truck, text: "Frete calculado no checkout para todo o Brasil" },
  { icon: ShieldCheck, text: "Compra segura, seus dados sempre protegidos" },
  { icon: Sparkles, text: "Peças selecionadas com cuidado" },
];

export const TopBanner = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  const current = ANNOUNCEMENTS[index];
  const Icon = current.icon;

  return (
    <div className="bg-black text-[#e5b869] text-[10px] sm:text-[11px] tracking-[0.2em] uppercase border-b border-[rgba(229,184,105,0.16)] py-2.5 px-3 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center text-center px-2 min-h-[22px]">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Icon className="w-3.5 h-3.5" />
            <span>{current.text}</span>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-0.5 rounded hover:text-white transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
