import React, { useState, useEffect, useRef } from "react";
import { 
  StoreInfo, 
  ThemeCategory, 
  ThemeProduct, 
  StoreSection, 
  ThemeCustomConfig,
  BorderRadiusSize,
  ShadowSize,
  ThemeId
} from "@/types/theme";
import { 
  getThemeDefaults, 
  mergeThemeConfig, 
  THEME_DEFAULTS 
} from "@/features/theme/ThemeRegistry";
import { StorefrontLivePreview } from "./StorefrontLivePreview";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Type, 
  Square, 
  Share2, 
  RotateCcw, 
  Check, 
  Save, 
  Loader2, 
  Upload, 
  X, 
  ImageIcon, 
  MessageCircle, 
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface VisualStoreEditorProps {
  store: any;
  themeConfig: any;
  storeSections: StoreSection[];
  products: any[];
  categories: any[];
  onSaveSuccess?: (updatedStore: any, updatedConfig: any) => void;
}

type EditorCategoryTab = "identidade" | "cores" | "tipografia" | "botoes_cards" | "social_whatsapp";

export const VisualStoreEditor: React.FC<VisualStoreEditorProps> = ({
  store,
  themeConfig,
  storeSections,
  products,
  categories,
  onSaveSuccess,
}) => {
  const currentThemeId: ThemeId = (themeConfig?.config?.themeId || store.templates?.layout_key || "base-theme") as ThemeId;

  // Estado Local de Edição Visual (Design Tokens)
  const [editorConfig, setEditorConfig] = useState<ThemeCustomConfig>(() => {
    return mergeThemeConfig(themeConfig?.config, currentThemeId);
  });

  // Estado Local de Identidade da Loja
  const [storeName, setStoreName] = useState<string>(store.name || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estados de Controle do Editor
  const [activeTab, setActiveTab] = useState<EditorCategoryTab>("identidade");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");

  // Sincronização e Hidratação Inicial
  useEffect(() => {
    const merged = mergeThemeConfig(themeConfig?.config, currentThemeId);
    setEditorConfig(merged);
    setStoreName(store.name || "");

    if (store.logo_url) {
      if (store.logo_url.startsWith("http")) {
        setLogoPreview(store.logo_url);
      } else {
        supabase.storage
          .from("products")
          .createSignedUrl(store.logo_url, 31536000)
          .then(({ data }) => {
            if (data?.signedUrl) setLogoPreview(data.signedUrl);
          });
      }
    } else {
      setLogoPreview(null);
    }
    setIsDirty(false);
    setSaveStatus("saved");
  }, [store.id, themeConfig?.id, currentThemeId]);

  // Manipulação de Upload de Logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WebP ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande. Tamanho máximo: 2MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setIsDirty(true);
      setSaveStatus("unsaved");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  // Atualizador Atômico de Cores
  const updateColor = (colorKey: keyof ThemeCustomConfig["colors"], value: string) => {
    setEditorConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
        // Mantém compatibilidade com accentPromotion da V1
        ...(colorKey === "primary" && !prev.colors.accentPromotion ? { accentPromotion: value } : {}),
      },
    }));
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  // Atualizador Atômico de Tipografia
  const updateTypography = (typographyKey: keyof ThemeCustomConfig["typography"], value: any) => {
    setEditorConfig((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [typographyKey]: value,
      },
    }));
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  // Atualizador Atômico de Layout (Raio e Sombra)
  const updateLayout = (layoutKey: keyof ThemeCustomConfig["layout"], value: any) => {
    setEditorConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [layoutKey]: value,
      },
    }));
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  // Atualizador Atômico de Redes Sociais e WhatsApp
  const updateSocial = (socialKey: keyof NonNullable<ThemeCustomConfig["social"]>, value: string) => {
    setEditorConfig((prev) => ({
      ...prev,
      social: {
        ...(prev.social || {}),
        [socialKey]: value,
      },
    }));
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  // Restaurar Padrão do Tema Atual (Reset Seguro)
  const handleResetToDefaults = () => {
    const confirmReset = window.confirm(
      `Deseja restaurar as cores, tipografia e estilos para o padrão do tema "${currentThemeId}"?\n\nSeus produtos, categorias, pedidos e seções não serão alterados.`
    );
    if (!confirmReset) return;

    const defaults = getThemeDefaults(currentThemeId);
    setEditorConfig(defaults);
    setIsDirty(true);
    setSaveStatus("unsaved");
    toast.success(`Estilos restaurados para o padrão do tema ${currentThemeId}!`);
  };

  // Persistência em Lote no Supabase
  const handleSaveCustomization = async () => {
    if (!storeName.trim()) {
      toast.error("O nome da loja não pode ficar em branco.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // 1. Upload do Logo (se alterado)
      let resolvedLogoUrl = store.logo_url || null;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${store.id}/logo/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        resolvedLogoUrl = filePath;
      } else if (logoPreview === null) {
        resolvedLogoUrl = null;
      }

      // 2. Atualiza Identidade em `stores`
      const { error: storeError } = await supabase
        .from("stores")
        .update({
          name: storeName.trim(),
          logo_url: resolvedLogoUrl,
        })
        .eq("id", store.id);
      if (storeError) throw storeError;

      // 3. Atualiza Payload Completo de Customização em `store_theme_configs`
      const payloadToSave: ThemeCustomConfig = {
        ...editorConfig,
        themeId: currentThemeId,
        identity: {
          name: storeName.trim(),
          logo_url: resolvedLogoUrl,
        },
      };

      const { error: themeError } = await supabase
        .from("store_theme_configs")
        .update({ config: payloadToSave })
        .eq("store_id", store.id);
      if (themeError) throw themeError;

      setIsDirty(false);
      setSaveStatus("saved");
      setLogoFile(null);

      const updatedStore = {
        ...store,
        name: storeName.trim(),
        logo_url: resolvedLogoUrl,
      };

      if (onSaveSuccess) {
        onSaveSuccess(updatedStore, { config: payloadToSave });
      }

      toast.success("Personalização salva com sucesso! Sua vitrine pública foi atualizada.");
    } catch (err: any) {
      console.error("Erro ao salvar personalização:", err);
      setSaveStatus("error");
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setIsSaving(false);
    }
  };

  const previewStoreInfo: StoreInfo = {
    id: store.id,
    slug: store.slug,
    name: storeName.trim() || store.name || "Minha Loja",
    logo_url: logoPreview,
    banner_url: store.banner_url || null,
    whatsapp: editorConfig.social?.whatsapp || store.whatsapp,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-heading font-bold">Editor Visual da Loja</h2>
            {saveStatus === "unsaved" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Alterações não salvas
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                Salvo
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Salvando alterações...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Personalize a identidade visual, cores, tipografia e botões da sua vitrine com visualização em tempo real.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restaurar Padrão
          </Button>

          {store.slug && (
            <Button variant="outline" size="sm" asChild className="text-xs font-semibold">
              <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Abrir Loja Pública
              </a>
            </Button>
          )}

          <Button
            type="button"
            className="btn-premium text-xs font-bold"
            onClick={handleSaveCustomization}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Dual-Pane Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Categorized Controls (Col 1 to 5) */}
        <div className="lg:col-span-5 bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
          {/* Category Navigation Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-secondary/60 p-1.5 rounded-2xl border border-border">
            {[
              { id: "identidade", label: "Identidade", icon: ImageIcon },
              { id: "cores", label: "Cores", icon: Palette },
              { id: "tipografia", label: "Tipografia", icon: Type },
              { id: "botoes_cards", label: "Estilos", icon: Square },
              { id: "social_whatsapp", label: "Social", icon: Share2 },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id as EditorCategoryTab)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 text-primary" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: IDENTIDADE */}
          {activeTab === "identidade" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Identidade da Marca
                </h3>
                <p className="text-xs text-muted-foreground">Nome e logotipo visíveis na vitrine pública.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-store-name">Nome da Loja</Label>
                <Input
                  id="editor-store-name"
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    setIsDirty(true);
                    setSaveStatus("unsaved");
                  }}
                  placeholder="Ex: Minha Boutique Exclusiva"
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label>Logotipo da Loja</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="editor-logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      {logoPreview ? "Trocar Logo" : "Enviar Logo"}
                    </Button>
                    {logoPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Remover Logo
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">PNG, JPG, SVG ou WebP (máx. 2MB).</p>
              </div>
            </div>
          )}

          {/* TAB 2: CORES */}
          {activeTab === "cores" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Paleta de Cores do Tema
                </h3>
                <p className="text-xs text-muted-foreground">Cores aplicadas em botões, fundos, cards e textos.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: "primary", label: "Cor Principal (Marca & Destaques)", value: editorConfig.colors.primary },
                  { key: "secondary", label: "Cor Secundária (Apoio)", value: editorConfig.colors.secondary },
                  { key: "accent", label: "Cor de Destaque / Promoção", value: editorConfig.colors.accent || editorConfig.colors.primary },
                  { key: "background", label: "Fundo Geral da Loja", value: editorConfig.colors.background },
                  { key: "surface", label: "Fundo de Cards & Superfícies", value: editorConfig.colors.surface },
                  { key: "text", label: "Cor do Texto Principal", value: editorConfig.colors.text },
                  { key: "textMuted", label: "Cor do Texto Secundário (Legendas)", value: editorConfig.colors.textMuted },
                  { key: "border", label: "Cor das Bordas e Linhas", value: editorConfig.colors.border },
                  { key: "button", label: "Fundo dos Botões de Ação", value: editorConfig.colors.button },
                  { key: "buttonText", label: "Texto dos Botões de Ação", value: editorConfig.colors.buttonText },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/60 hover:border-border transition-colors">
                    <div>
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={item.value || "#000000"}
                        onChange={(e) => updateColor(item.key as any, e.target.value)}
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0"
                      />
                      <Input
                        value={item.value || ""}
                        onChange={(e) => updateColor(item.key as any, e.target.value)}
                        className="w-24 h-8 text-xs font-mono uppercase px-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIPOGRAFIA */}
          {activeTab === "tipografia" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" />
                  Tipografia da Vitrine
                </h3>
                <p className="text-xs text-muted-foreground">Famílias e pesos tipográficos suportados.</p>
              </div>

              <div className="space-y-2">
                <Label>Fonte dos Títulos (Headings)</Label>
                <select
                  value={editorConfig.typography.headingFontFamily}
                  onChange={(e) => updateTypography("headingFontFamily", e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna e Limpa)</option>
                  <option value="Space Grotesk">Space Grotesk (Geométrica / Tech)</option>
                  <option value="Cinzel">Cinzel (Serifada / Luxo & Joias)</option>
                  <option value="Montserrat">Montserrat (Elegante & Sofisticada)</option>
                  <option value="Playfair Display">Playfair Display (Editorial Clássico)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Peso dos Títulos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "semibold", label: "Semibold (600)" },
                    { id: "bold", label: "Bold (700)" },
                    { id: "extrabold", label: "Extrabold (800)" },
                  ].map((weight) => (
                    <button
                      key={weight.id}
                      type="button"
                      onClick={() => updateTypography("headingWeight", weight.id)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        editorConfig.typography.headingWeight === weight.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {weight.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fonte do Corpo de Texto</Label>
                <select
                  value={editorConfig.typography.fontFamily}
                  onChange={(e) => updateTypography("fontFamily", e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Recomendada)</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Inter">Inter</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: BOTÕES & CARDS */}
          {activeTab === "botoes_cards" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Square className="w-4 h-4 text-primary" />
                  Formato de Botões & Cards
                </h3>
                <p className="text-xs text-muted-foreground">Arredondamento e elevação dos elementos interativos.</p>
              </div>

              {/* Botões Radius */}
              <div className="space-y-2">
                <Label>Arredondamento dos Botões</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "Reto (0px)" },
                    { id: "sm", label: "Suave (2px)" },
                    { id: "lg", label: "Médio (8px)" },
                    { id: "full", label: "Pílula (Total)" },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => updateLayout("borderRadius", rad.id as BorderRadiusSize)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                        editorConfig.layout.borderRadius === rad.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Radius */}
              <div className="space-y-2">
                <Label>Arredondamento dos Cards de Produto</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "Reto (0px)" },
                    { id: "md", label: "Suave (6px)" },
                    { id: "2xl", label: "Grande (16px)" },
                    { id: "3xl", label: "Extra (24px)" },
                  ].map((cardRad) => (
                    <button
                      key={cardRad.id}
                      type="button"
                      onClick={() => updateLayout("cardRadius", cardRad.id as BorderRadiusSize)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                        editorConfig.layout.cardRadius === cardRad.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cardRad.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Shadow */}
              <div className="space-y-2">
                <Label>Sombra e Elevação dos Cards</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "Sem Sombra" },
                    { id: "sm", label: "Sutil" },
                    { id: "md", label: "Média" },
                    { id: "xl", label: "Intensa" },
                  ].map((shadow) => (
                    <button
                      key={shadow.id}
                      type="button"
                      onClick={() => updateLayout("cardShadow", shadow.id as ShadowSize)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                        editorConfig.layout.cardShadow === shadow.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {shadow.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REDES SOCIAIS & WHATSAPP */}
          {activeTab === "social_whatsapp" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Redes Sociais & Contato
                </h3>
                <p className="text-xs text-muted-foreground">Canais de atendimento e engajamento da loja.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-whatsapp">WhatsApp de Atendimento</Label>
                <Input
                  id="editor-whatsapp"
                  value={editorConfig.social?.whatsapp || ""}
                  onChange={(e) => updateSocial("whatsapp", e.target.value)}
                  placeholder="Ex: 5511999999999"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-whatsapp-msg">Mensagem Padrão do WhatsApp</Label>
                <Input
                  id="editor-whatsapp-msg"
                  value={editorConfig.social?.whatsappMessage || ""}
                  onChange={(e) => updateSocial("whatsappMessage", e.target.value)}
                  placeholder="Ex: Olá! Gostaria de tirar uma dúvida sobre um produto."
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-instagram">Instagram</Label>
                <Input
                  id="editor-instagram"
                  value={editorConfig.social?.instagram || ""}
                  onChange={(e) => updateSocial("instagram", e.target.value)}
                  placeholder="Ex: @minhaloja ou link do perfil"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editor-tiktok">TikTok</Label>
                <Input
                  id="editor-tiktok"
                  value={editorConfig.social?.tiktok || ""}
                  onChange={(e) => updateSocial("tiktok", e.target.value)}
                  placeholder="Ex: @minhaloja"
                  className="h-11"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Live Responsive Preview (Col 6 to 12) */}
        <div className="lg:col-span-7 h-full min-h-[600px] sticky top-6">
          <StorefrontLivePreview
            store={previewStoreInfo}
            categories={categories}
            products={products}
            sections={storeSections}
            customConfig={editorConfig}
            deviceMode={deviceMode}
            onToggleDevice={setDeviceMode}
          />
        </div>
      </div>
    </div>
  );
};
