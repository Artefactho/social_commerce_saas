# Theme Registry — Registro Oficial de Temas do Social Commerce SaaS

> **Status:** Especificação Oficial de Temas  
> **Objetivo:** Catálogo formal dos 5 temas oficiais disponíveis para seleção e ativação pelas lojas lojistas.

---

## 1. Catálogo dos 5 Temas Oficiais

```text
THEME REGISTRY
├── 1. Base Theme (Nuvemshop Base Theme) → layout_key: 'base-theme'
├── 2. Aura Maison (Moda & Luxo)         → layout_key: 'aura-maison' (alias: 'premium')
├── 3. Áurea Joalheria (Joias & Ônix)    → layout_key: 'aurea-joalheria'
├── 4. Jô Perfumes (Instagram Shop)      → layout_key: 'jo-perfumes'
└── 5. Minimal Clean (Direto & Moderno)  → layout_key: 'minimal-clean'
```

---

## 2. Ficha Técnica dos 5 Temas

| Identificador (`id` / `layout_key`) | Nome Oficial | Nicho / Propósito | Origem / Localização | Estado Atual |
| :--- | :--- | :--- | :--- | :--- |
| **`base-theme`** | **Base Theme** | E-commerce Multi-propósito completo com sliders, banners informativos, instafeed e vídeo. | `TEMPLATES MODELO LOJA/base-theme-master/` | `[PARCIAL]` (Localizado e mapeado para React/TSX) |
| **`aura-maison`** | **Aura Maison** | Moda de luxo, coleções sofisticadas e drawer minimalista. | `src/features/theme/aura-maison/` | `[OK]` (Ativo) |
| **`aurea-joalheria`** | **Áurea Joalheria**| Joias, contraste preto/dourado e tipografia serifada de alta conversão. | `src/features/theme/aurea-joalheria/` | `[OK]` (Ativo) |
| **`jo-perfumes`** | **Jô Perfumes & Cosméticos** | Estilo Instagram Shop com Stories dinâmicos, Bio de perfil e Bottom Nav mobile. | `src/features/theme/jo-perfumes/` | `[OK]` (Ativo) |
| **`minimal-clean`** | **Minimal Clean** | Foco absoluto na fotografia dos produtos e checkout rápido. | `src/features/theme/minimal-clean/` | `[PARCIAL]` (Extração de layout inline pendente) |

---

## 3. Contrato Unificado de Ativação do Tema

O lojista escolhe o tema no painel (Dashboard → Aparência) ou durante o Onboarding. A seleção atualiza a coluna `stores.active_template_id` e a tabela `store_theme_configs`.

```typescript
export interface StorefrontThemeProps {
  store: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    banner_url: string | null;
  };
  categories: { id: string; name: string; slug: string }[];
  products: Product[];
  colors?: Record<string, string>;
  sections?: StoreSection[];
}
```

---

## 4. Theme Registry Dispatcher (`ThemeRenderer`)

```tsx
import { BaseThemeStorefront } from "@/features/theme/base-theme/BaseThemeStorefront";
import { AuraMaisonStorefront } from "@/features/theme/aura-maison/AuraMaisonStorefront";
import { AureaJoalheriaStorefront } from "@/features/theme/aurea-joalheria/AureaJoalheriaStorefront";
import { JoPerfumesStorefront } from "@/features/theme/jo-perfumes/JoPerfumesStorefront";
import { MinimalCleanStorefront } from "@/features/theme/minimal-clean/MinimalCleanStorefront";

export const THEME_COMPONENTS: Record<string, React.FC<StorefrontThemeProps>> = {
  'base-theme': BaseThemeStorefront,
  'aura-maison': AuraMaisonStorefront,
  'premium': AuraMaisonStorefront, // retrocompatibilidade
  'aurea-joalheria': AureaJoalheriaStorefront,
  'jo-perfumes': JoPerfumesStorefront,
  'minimal-clean': MinimalCleanStorefront,
  'minimal': MinimalCleanStorefront, // retrocompatibilidade
};

export const ThemeRenderer: React.FC<{ themeId: string; data: StorefrontThemeProps }> = ({ themeId, data }) => {
  const Component = THEME_COMPONENTS[themeId] || THEME_COMPONENTS['base-theme'];
  return <Component {...data} />;
};
```

---

## 5. Como Adicionar Novos Temas

Para criar e registrar um 6º tema no futuro:
1. Criar pasta em `src/features/theme/<theme-slug>/`;
2. Exportar o componente `<ThemeSlug>Storefront` respeitando rigorosamente a interface `StorefrontThemeProps`;
3. Definir os design tokens no `theme.config.ts`;
4. Registrar o identificador no `THEME_COMPONENTS` do `Theme Registry`;
5. Adicionar a migration de insert na tabela `public.templates`.
