import React from "react";
import { 
  ThemeCustomConfig, 
  BorderRadiusSize, 
  ShadowSize 
} from "@/types/theme";

export const BORDER_RADIUS_MAP: Record<BorderRadiusSize, string> = {
  none: "0px",
  sm: "0.125rem",  // 2px
  md: "0.375rem",  // 6px
  lg: "0.5rem",    // 8px
  xl: "0.75rem",   // 12px
  "2xl": "1rem",   // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

export const SHADOW_MAP: Record<ShadowSize, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

export const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

/**
 * Converte um ThemeCustomConfig em variáveis CSS (--theme-*)
 * prontas para injeção na raiz do Storefront.
 */
export function buildThemeCssVariables(config: ThemeCustomConfig): Record<string, string> {
  const colors = config?.colors || ({} as any);
  const typography = config?.typography || ({} as any);
  const layout = config?.layout || ({} as any);

  const primary = colors.primary || "#000000";
  const secondary = colors.secondary || "#111111";
  const accent = colors.accent || colors.accentPromotion || primary;
  const accentPromotion = colors.accentPromotion || accent || primary;
  const background = colors.background || "#FFFFFF";
  const surface = colors.surface || background;
  const text = colors.text || "#111111";
  const textMuted = colors.textMuted || "#6B7280";
  const border = colors.border || "#E5E7EB";
  const button = colors.button || primary;
  const buttonText = colors.buttonText || "#FFFFFF";

  const borderRadius = BORDER_RADIUS_MAP[layout.borderRadius as BorderRadiusSize] || "9999px";
  const cardRadius = BORDER_RADIUS_MAP[layout.cardRadius as BorderRadiusSize] || "1rem";
  const cardShadow = SHADOW_MAP[layout.cardShadow as ShadowSize] || "none";

  const fontBody = typography.fontFamily 
    ? `'${typography.fontFamily}', sans-serif` 
    : "'Plus Jakarta Sans', sans-serif";

  const fontHeading = typography.headingFontFamily 
    ? `'${typography.headingFontFamily}', sans-serif` 
    : fontBody;

  const headingWeight = FONT_WEIGHT_MAP[typography.headingWeight] || "700";

  return {
    "--theme-primary": primary,
    "--theme-secondary": secondary,
    "--theme-accent": accent,
    "--theme-accent-promotion": accentPromotion,
    "--theme-background": background,
    "--theme-surface": surface,
    "--theme-text": text,
    "--theme-text-muted": textMuted,
    "--theme-border": border,
    "--theme-button": button,
    "--theme-button-text": buttonText,
    "--theme-radius": borderRadius,
    "--theme-card-radius": cardRadius,
    "--theme-card-shadow": cardShadow,
    "--theme-font-body": fontBody,
    "--theme-font-heading": fontHeading,
    "--theme-heading-weight": headingWeight,
  };
}
