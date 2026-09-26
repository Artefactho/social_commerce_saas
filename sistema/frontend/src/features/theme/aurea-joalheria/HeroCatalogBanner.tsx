import { ArrowRight, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { ThemeColors } from "./Header";

interface HeroCatalogBannerProps {
  storeName: string;
  bannerUrl?: string | null;
  onExploreClick: () => void;
  colors?: ThemeColors;
}

// Mesma copy neutra/genérica do Hero do Aura Maison (já revisada, sem
// promessa de nicho específico) — a identidade deste tema vem do sistema
// visual (paleta ônix+ouro, tipografia, moldura com glow radial extraída do
// template de referência "Aurea Joalheria"), não de texto reescrito.
export const HeroCatalogBanner: React.FC<HeroCatalogBannerProps> = ({ storeName, bannerUrl, onExploreClick, colors }) => {
  const primary = colors?.primary || "#e5b869";

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-10 max-w-5xl mx-auto">
      <div
        className="relative overflow-hidden rounded-3xl text-center py-16 px-6 sm:py-20"
        style={{
          background: "radial-gradient(ellipse at center, #14141a 0%, #050506 100%)",
          border: "1px solid rgba(229,184,105,0.16)",
        }}
      >
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#e5b869]/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-80 h-80 rounded-full bg-[#e5b869]/10 blur-3xl pointer-events-none" />

        {bannerUrl && (
          <img
            src={bannerUrl}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}

        <div className="relative z-10">
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#e5b869] font-semibold mb-4">
            Descubra o melhor de
          </p>
          <h1
            className="font-heading text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4"
            style={{
              backgroundImage: "linear-gradient(135deg, #faebb7 0%, #e5b869 50%, #9e7529 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {storeName}
          </h1>
          <p className="text-[#8c8c9a] text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-9 font-light">
            Peças selecionadas com cuidado, prontas para você.
          </p>

          <button
            onClick={onExploreClick}
            className="inline-flex items-center justify-center gap-2.5 font-bold px-8 py-3.5 rounded-full text-xs sm:text-sm tracking-[0.15em] uppercase transition-all transform hover:-translate-y-0.5 shadow-lg"
            style={{ backgroundColor: primary, color: "#050506" }}
          >
            <span>Explorar Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-9 mt-9 border-t border-[rgba(229,184,105,0.16)] text-[11px] text-[#8c8c9a] font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#e5b869] shrink-0" />
              <span>Compra Segura</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#e5b869] shrink-0" />
              <span>Envio para todo o Brasil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e5b869] shrink-0" />
              <span>Atendimento Dedicado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
