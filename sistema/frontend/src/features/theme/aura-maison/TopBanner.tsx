import { useState, useEffect } from "react";
import { Truck, ShieldCheck, Sparkles, X } from "lucide-react";

// ASSUMPTION: mensagens genéricas, sem valores/promessas específicas (frete
// grátis, cupom, etc.) porque a loja ainda não tem esses dados configuráveis
// no schema (ver PROGRESS.md, seção "FASE 4.1"). Baixo impacto, reversível.
const ANNOUNCEMENTS = [
  { icon: Truck, text: "Frete calculado no checkout para todo o Brasil" },
  { icon: ShieldCheck, text: "Compra segura, seus dados sempre protegidos" },
  { icon: Sparkles, text: "Produtos selecionados com cuidado" },
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
    <div className="bg-[#1A1816] text-[#F3EFEA] text-[11px] sm:text-xs tracking-wider border-b border-[#2C2723] py-2 px-3 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center text-center px-2 min-h-[22px]">
          <div className="flex items-center justify-center gap-1.5 font-medium">
            <Icon className="w-3.5 h-3.5 text-amber-300" />
            <span>{current.text}</span>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-0.5 rounded hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
