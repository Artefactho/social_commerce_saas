import { ArrowRight, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { ThemeColors } from "./Header";

interface HeroCatalogBannerProps {
  storeName: string;
  bannerUrl?: string | null;
  onExploreClick: () => void;
  colors?: ThemeColors;
}

export const HeroCatalogBanner: React.FC<HeroCatalogBannerProps> = ({ storeName, bannerUrl, onExploreClick, colors }) => {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#201C18] via-[#2D2620] to-[#1A1715] text-[#FAF8F5] shadow-xl border border-[#3E362F]/60">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-amber-700/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[380px] relative z-10">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15] mb-4">
              Descubra o melhor de {storeName}
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mb-8 font-light">
              Produtos selecionados com cuidado, prontos para você.
            </p>

            <button
              onClick={onExploreClick}
              className={`flex items-center justify-center gap-2.5 text-stone-950 font-bold px-7 py-3.5 rounded-full text-xs sm:text-sm tracking-wider uppercase transition-all transform hover:-translate-y-0.5 shadow-lg w-fit ${
                colors?.primary ? "hover:opacity-90" : "bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200"
              }`}
              style={colors?.primary ? { backgroundColor: colors.primary } : undefined}
            >
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-3 gap-3 pt-8 mt-8 border-t border-white/10 text-[11px] text-stone-300 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Compra Segura</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Envio para todo o Brasil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Atendimento Dedicado</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 lg:p-10 flex items-center justify-center relative">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/30 aspect-4/3">
              {bannerUrl ? (
                <img src={bannerUrl} alt={storeName} className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900/40 via-stone-800 to-stone-950 flex items-center justify-center">
                  <span className="font-heading text-2xl text-amber-200/70 tracking-wide">{storeName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
