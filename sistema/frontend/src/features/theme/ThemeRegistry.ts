import React from "react";
import { 
  StorefrontThemeProps, 
  ThemeMetadata, 
  ThemeId, 
  ThemeCustomConfig 
} from "@/types/theme";
import { BaseThemeStorefront } from "./base-theme/BaseThemeStorefront";
import { AuraMaisonStorefront } from "./aura-maison/AuraMaisonStorefront";
import { AureaJoalheriaStorefront } from "./aurea-joalheria/AureaJoalheriaStorefront";
import { JoPerfumesStorefront } from "./jo-perfumes/JoPerfumesStorefront";
import { MinimalCleanStorefront } from "./minimal-clean/MinimalCleanStorefront";

export const OFFICIAL_THEMES: ThemeMetadata[] = [
  {
    id: "base-theme",
    name: "Base Theme",
    layout_key: "base-theme",
    tag: "E-commerce Completo",
    description: "Tema clássico multi-propósito com sliders, banners de serviços, destaques de categorias, instafeed e suporte a WhatsApp.",
    thumbnail_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    preview_url: "/store/demo-base-theme",
    features: ["Hero Slider", "Banners Informativos", "Showcase de Categorias", "Botão WhatsApp"],
  },
  {
    id: "aura-maison",
    name: "Aura Maison",
    layout_key: "aura-maison",
    tag: "Moda & Luxo",
    description: "Tema oficial de luxo, com catálogo sofisticado, drawer de carrinho lateral e favoritos adaptados aos seus produtos.",
    thumbnail_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    preview_url: "/store/demo-aura-maison",
    features: ["Drawer de Carrinho", "Favoritos", "Coleções em Destaque", "Visual Minimalista"],
  },
  {
    id: "aurea-joalheria",
    name: "Áurea Joalheria",
    layout_key: "aurea-joalheria",
    tag: "Joias & Acessórios",
    description: "Tema em tons de ônix e dourado com tipografia serifada de alta conversão para marcas premium.",
    thumbnail_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    preview_url: "/store/demo-aurea-joalheria",
    features: ["Tema Escuro (Dark Mode)", "Tipografia Serifada", "Catálogo Luxo", "Alta Conversão"],
  },
  {
    id: "jo-perfumes",
    name: "Jô Perfumes & Cosméticos",
    layout_key: "jo-perfumes",
    tag: "Perfumaria & Beleza",
    description: "Tema estilo Instagram Shop com Stories dinâmicos, Bio de perfil verificada, Hero Carousel e Bottom Nav mobile.",
    thumbnail_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
    preview_url: "/store/demo-jo-perfumes",
    features: ["Stories Estilo Instagram", "Hero Carousel", "Badges de Desconto", "Bottom Nav Mobile"],
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    layout_key: "minimal-clean",
    tag: "Moderno & Direto",
    description: "Design clean e veloz com foco total na fotografia dos produtos e compra sem distrações.",
    thumbnail_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    preview_url: "/store/demo-minimal-clean",
    features: ["Velocidade Máxima", "Grid Limpo", "Foco em Fotos", "Checkout Direto"],
  },
];

export const THEME_DEFAULTS: Record<ThemeId, ThemeCustomConfig> = {
  "base-theme": {
    themeId: "base-theme",
    colors: {
      primary: "#000000",
      secondary: "#111111",
      accent: "#F59E0B",
      accentPromotion: "#F59E0B",
      background: "#FDFDFD",
      surface: "#FFFFFF",
      text: "#222222",
      textMuted: "#6B7280",
      border: "#E5E7EB",
      button: "#000000",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFontFamily: "Plus Jakarta Sans",
      headingWeight: "extrabold",
    },
    layout: {
      borderRadius: "full",
      cardRadius: "2xl",
      cardShadow: "md",
    },
    social: {
      instagram: "",
      whatsapp: "",
      whatsappMessage: "Olá! Gostaria de tirar uma dúvida sobre um produto da loja.",
    },
  },
  "aura-maison": {
    themeId: "aura-maison",
    colors: {
      primary: "#1C1917",
      secondary: "#D1C3AD",
      accent: "#C5A880",
      accentPromotion: "#C5A880",
      background: "#FAF8F5",
      surface: "#F2EDE4",
      text: "#292524",
      textMuted: "#78716C",
      border: "#E8E0D2",
      button: "#1C1917",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFontFamily: "Plus Jakarta Sans",
      headingWeight: "bold",
    },
    layout: {
      borderRadius: "full",
      cardRadius: "3xl",
      cardShadow: "lg",
    },
    social: {
      instagram: "",
      whatsapp: "",
      whatsappMessage: "Olá! Gostaria de mais informações sobre os produtos exclusivos.",
    },
  },
  "aurea-joalheria": {
    themeId: "aurea-joalheria",
    colors: {
      primary: "#D4AF37",
      secondary: "#18181B",
      accent: "#F59E0B",
      accentPromotion: "#D4AF37",
      background: "#050506",
      surface: "#111113",
      text: "#DEDEE6",
      textMuted: "#A1A1AA",
      border: "#27272A",
      button: "#D4AF37",
      buttonText: "#000000",
    },
    typography: {
      fontFamily: "Montserrat",
      headingFontFamily: "Cinzel",
      headingWeight: "semibold",
    },
    layout: {
      borderRadius: "sm",
      cardRadius: "sm",
      cardShadow: "xl",
    },
    social: {
      instagram: "",
      whatsapp: "",
      whatsappMessage: "Olá! Gostaria de atendimento exclusivo para joias finas.",
    },
  },
  "jo-perfumes": {
    themeId: "jo-perfumes",
    colors: {
      primary: "#F43F5E",
      secondary: "#F59E0B",
      accent: "#F43F5E",
      accentPromotion: "#F43F5E",
      background: "#0D0D0F",
      surface: "#18181C",
      text: "#F4F4F5",
      textMuted: "#A1A1AA",
      border: "#27272A",
      button: "#F43F5E",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFontFamily: "Plus Jakarta Sans",
      headingWeight: "bold",
    },
    layout: {
      borderRadius: "full",
      cardRadius: "2xl",
      cardShadow: "lg",
    },
    social: {
      instagram: "",
      whatsapp: "",
      whatsappMessage: "Olá! Gostaria de ajuda para escolher a fragrância ideal.",
    },
  },
  "minimal-clean": {
    themeId: "minimal-clean",
    colors: {
      primary: "#18181B",
      secondary: "#71717A",
      accent: "#000000",
      accentPromotion: "#18181B",
      background: "#FFFFFF",
      surface: "#F4F4F5",
      text: "#18181B",
      textMuted: "#71717A",
      border: "#E4E4E7",
      button: "#18181B",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFontFamily: "Plus Jakarta Sans",
      headingWeight: "bold",
    },
    layout: {
      borderRadius: "xl",
      cardRadius: "xl",
      cardShadow: "none",
    },
    social: {
      instagram: "",
      whatsapp: "",
      whatsappMessage: "Olá! Gostaria de tirar uma dúvida sobre um produto.",
    },
  },
};

export const THEME_COMPONENTS: Record<string, React.FC<StorefrontThemeProps>> = {
  "base-theme": BaseThemeStorefront,
  "aura-maison": AuraMaisonStorefront,
  "premium": AuraMaisonStorefront, // retrocompatibilidade
  "aurea-joalheria": AureaJoalheriaStorefront,
  "jo-perfumes": JoPerfumesStorefront,
  "minimal-clean": MinimalCleanStorefront,
  "minimal": MinimalCleanStorefront, // retrocompatibilidade
};

export const resolveThemeComponent = (layoutKey?: string | null): React.FC<StorefrontThemeProps> => {
  if (!layoutKey) return BaseThemeStorefront;
  const normalizedKey = layoutKey.toLowerCase().trim();
  return THEME_COMPONENTS[normalizedKey] || BaseThemeStorefront;
};

export const getThemeDefaults = (themeId?: string | null): ThemeCustomConfig => {
  if (!themeId) return THEME_DEFAULTS["base-theme"];
  const normalized = themeId.toLowerCase().trim() as ThemeId;
  if (normalized === ("premium" as any)) return THEME_DEFAULTS["aura-maison"];
  if (normalized === ("minimal" as any)) return THEME_DEFAULTS["minimal-clean"];
  return THEME_DEFAULTS[normalized] || THEME_DEFAULTS["base-theme"];
};

export const mergeThemeConfig = (
  savedConfig?: Partial<ThemeCustomConfig> | null,
  themeId?: string | null
): ThemeCustomConfig => {
  const effectiveThemeId = (savedConfig?.themeId || themeId || "base-theme") as ThemeId;
  const defaults = getThemeDefaults(effectiveThemeId);

  if (!savedConfig) return defaults;

  return {
    ...defaults,
    themeId: effectiveThemeId,
    colors: {
      ...defaults.colors,
      ...(savedConfig.colors || {}),
      accentPromotion: savedConfig.colors?.accentPromotion || savedConfig.colors?.primary || defaults.colors.accentPromotion,
    },
    typography: {
      ...defaults.typography,
      ...(savedConfig.typography || {}),
    },
    layout: {
      ...defaults.layout,
      ...(savedConfig.layout || {}),
    },
    social: {
      ...defaults.social,
      ...(savedConfig.social || {}),
    },
    identity: {
      ...defaults.identity,
      ...(savedConfig.identity || {}),
    },
  };
};

