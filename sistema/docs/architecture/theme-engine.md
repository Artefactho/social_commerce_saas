# Theme Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Tokens de design, temas, tipografia, injeção de CSS variables e renderizadores de seções.  
> **Catálogo:** 5 Temas Oficiais (Base Theme, Aura Maison, Áurea Joalheria, Jô Perfumes, Minimal Clean).  
> **Regra Suprema:** O Theme Engine **NÃO** deve conter regras comerciais (cálculo de preço, frete ou mutações diretas).

---

## 1. Theme Contract (Contrato Unificado dos 5 Temas)

Todo tema é uma configuração pura que alimenta o Design System e o Section Engine:

```typescript
export interface ThemeContract {
  id: 'base-theme' | 'aura-maison' | 'aurea-joalheria' | 'jo-perfumes' | 'minimal-clean';
  name: string;
  version: string;
  tokens: {
    colors: {
      primary: string;             // --theme-primary
      primaryForeground: string;   // --theme-primary-fg
      background: string;          // --theme-bg
      surface: string;             // --theme-surface
      text: string;                // --theme-text
      textMuted: string;           // --theme-text-muted
      border: string;              // --theme-border
      accent: string;              // --theme-accent
    };
    typography: {
      fontHeading: string;         // 'Muli' | 'Playfair Display' | 'Cinzel' | 'Plus Jakarta Sans'
      fontBody: string;            // 'Muli' | 'Inter' | 'Plus Jakarta Sans'
      headingWeight: string;
    };
    radii: {
      button: string;              // 'rounded-full' | 'rounded-xl' | 'rounded-md' | 'rounded-none'
      card: string;                // 'rounded-3xl' | 'rounded-xl' | 'rounded-lg' | 'rounded-none'
    };
    badges: {
      style: 'pill' | 'square' | 'minimal';
    };
  };
}
```

---

## 2. Injeção de CSS Variables no DOM

```tsx
export const ThemeProvider: React.FC<{ theme: ThemeContract; children: React.ReactNode }> = ({ theme, children }) => {
  const style = {
    '--theme-primary': theme.tokens.colors.primary,
    '--theme-primary-fg': theme.tokens.colors.primaryForeground,
    '--theme-bg': theme.tokens.colors.background,
    '--theme-surface': theme.tokens.colors.surface,
    '--theme-text': theme.tokens.colors.text,
    '--theme-text-muted': theme.tokens.colors.textMuted,
    '--theme-border': theme.tokens.colors.border,
    '--theme-accent': theme.tokens.colors.accent,
    '--font-heading': theme.tokens.typography.fontHeading,
    '--font-body': theme.tokens.typography.fontBody,
  } as React.CSSProperties;

  return (
    <div style={style} className="font-sans antialiased">
      {children}
    </div>
  );
};
```

---

## 3. Integração do Nuvemshop Base Theme

O código do Base Theme original localizado em `TEMPLATES MODELO LOJA/base-theme-master/` é integrado na arquitetura como o componente `BaseThemeStorefront` em `src/features/theme/base-theme/`.

Ele implementa:
- Sliders e carrosséis com controle mobile/desktop;
- Banners informativos e de serviços (Frete, Parcelamento, Atendimento);
- Destaque de categorias e grid de produtos;
- Feed social / Instagram / Vídeo;
- Banner de boas-vindas e newsletter institucional.
