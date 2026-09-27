import React, { useMemo } from "react";
import { 
  StoreInfo, 
  ThemeCategory, 
  ThemeProduct, 
  StoreSection, 
  ThemeCustomConfig 
} from "@/types/theme";
import { resolveThemeComponent } from "@/features/theme/ThemeRegistry";
import { buildThemeCssVariables } from "@/features/theme/themeTokens";
import { Monitor, Smartphone, Sparkles, ExternalLink } from "lucide-react";

interface StorefrontLivePreviewProps {
  store: StoreInfo;
  categories: ThemeCategory[];
  products: ThemeProduct[];
  sections: StoreSection[];
  customConfig: ThemeCustomConfig;
  deviceMode: "desktop" | "mobile";
  onToggleDevice?: (mode: "desktop" | "mobile") => void;
}

// Exemplos realistas caso a loja ainda não tenha produtos ou categorias cadastrados
const FALLBACK_PREVIEW_PRODUCTS: ThemeProduct[] = [
  {
    id: "prev-1",
    name: "Produto Exemplo em Destaque",
    slug: "produto-exemplo-destaque",
    collection: "Lançamentos",
    price: 189.9,
    description: "Item em destaque para demonstração do tema e personalização visual.",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"],
    product_type: "physical",
  },
  {
    id: "prev-2",
    name: "Edição Especial Limitada",
    slug: "edicao-especial-limitada",
    collection: "Coleção 2026",
    price: 249.0,
    description: "Design exclusivo com acabamento refinado e alta qualidade.",
    images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80"],
    product_type: "physical",
  },
  {
    id: "prev-3",
    name: "Item Premium Selecionado",
    slug: "item-premium-selecionado",
    collection: "Lançamentos",
    price: 129.9,
    description: "Alta conversão e apresentação elegante no catálogo.",
    images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80"],
    product_type: "physical",
  },
];

const FALLBACK_PREVIEW_CATEGORIES: ThemeCategory[] = [
  { id: "c1", name: "Lançamentos", slug: "lancamentos" },
  { id: "c2", name: "Coleção 2026", slug: "colecao-2026" },
  { id: "c3", name: "Mais Vendidos", slug: "mais-vendidos" },
];

export const StorefrontLivePreview: React.FC<StorefrontLivePreviewProps> = ({
  store,
  categories,
  products,
  sections,
  customConfig,
  deviceMode,
  onToggleDevice,
}) => {
  const cssVariables = useMemo(() => {
    return buildThemeCssVariables(customConfig);
  }, [customConfig]);

  const StorefrontComponent = useMemo(() => {
    return resolveThemeComponent(customConfig.themeId);
  }, [customConfig.themeId]);

  const previewProducts = products && products.length > 0 ? products : FALLBACK_PREVIEW_PRODUCTS;
  const previewCategories = categories && categories.length > 0 ? categories : FALLBACK_PREVIEW_CATEGORIES;

  // Intercepta cliques de navegação para evitar sair da tela de personalização durante o preview
  const handlePreviewContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    const button = target.closest("button");

    if (anchor && !anchor.href.includes("#")) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (button && (button.type === "submit" || button.getAttribute("aria-label")?.includes("checkout"))) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border border-border/80 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Device Bar */}
      <div className="px-5 py-3.5 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Live Preview em Tempo Real
          </span>
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {customConfig.themeId}
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => onToggleDevice?.("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              deviceMode === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Visualização Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDevice?.("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              deviceMode === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Visualização Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (375px)</span>
          </button>
        </div>
      </div>

      {/* Preview Stage Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-start justify-center bg-zinc-900/60 min-h-[500px]">
        {deviceMode === "desktop" ? (
          /* Desktop Browser Mockup */
          <div 
            className="w-full bg-background rounded-2xl border border-border/80 shadow-2xl overflow-hidden flex flex-col"
            onClick={handlePreviewContainerClick}
          >
            {/* Desktop Mock Browser Header */}
            <div className="bg-muted/60 px-4 py-2 border-b border-border flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-sm mx-auto bg-background/80 border border-border/80 rounded-md px-3 py-1 text-[11px] text-muted-foreground font-mono flex items-center justify-between">
                <span>sualoja.com/store/{store.slug || "minha-loja"}</span>
                <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 rounded">SSL</span>
              </div>
            </div>

            {/* Desktop Live Storefront View */}
            <div
              className="storefront-theme-root w-full overflow-y-auto max-h-[750px]"
              style={cssVariables as React.CSSProperties}
              data-theme-id={customConfig.themeId}
              data-testid="preview-desktop-root"
            >
              <StorefrontComponent
                store={store}
                categories={previewCategories}
                products={previewProducts}
                colors={customConfig.colors}
                customConfig={customConfig}
                sections={sections}
              />
            </div>
          </div>
        ) : (
          /* Mobile Smartphone Mockup (~375px) */
          <div 
            className="w-[375px] max-w-full bg-background rounded-[40px] border-[10px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-2 shrink-0 ring-4 ring-black/40"
            onClick={handlePreviewContainerClick}
          >
            {/* Mobile Notch / Speaker */}
            <div className="bg-zinc-900 pt-3 pb-2 px-6 flex items-center justify-between text-white text-[11px] font-bold border-b border-zinc-800">
              <span>9:41</span>
              <div className="w-20 h-4 bg-zinc-950 rounded-full mx-auto" />
              <span>5G</span>
            </div>

            {/* Mobile URL Bar */}
            <div className="bg-zinc-900/90 px-4 py-1.5 text-center text-[10px] text-zinc-400 font-mono border-b border-zinc-800 truncate">
              store/{store.slug || "minha-loja"}
            </div>

            {/* Mobile Live Storefront View */}
            <div
              className="storefront-theme-root w-full overflow-y-auto max-h-[640px]"
              style={cssVariables as React.CSSProperties}
              data-theme-id={customConfig.themeId}
              data-testid="preview-mobile-root"
            >
              <StorefrontComponent
                store={store}
                categories={previewCategories}
                products={previewProducts}
                colors={customConfig.colors}
                customConfig={customConfig}
                sections={sections}
              />
            </div>

            {/* Mobile Bottom Home Bar */}
            <div className="bg-zinc-900 py-2 flex items-center justify-center">
              <div className="w-28 h-1 bg-zinc-600 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
