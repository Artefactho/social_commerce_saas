# Section Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Objetivo:** Permitir que a página inicial e páginas de conteúdo sejam compostas por blocos dinâmicos, ordenáveis e customizáveis pelo lojista, sem código hardcoded.

---

## 1. Modelo de Dados da Seção

```typescript
export type SectionType =
  | 'hero_slider'
  | 'categories_carousel'
  | 'featured_products'
  | 'promotions_grid'
  | 'stories_feed'
  | 'new_collection'
  | 'banner_split'
  | 'benefits_bar'
  | 'video_feature'
  | 'social_feed'
  | 'whatsapp_cta'
  | 'newsletter'
  | 'rich_text';

export interface StoreSection {
  id: string;
  store_id: string;
  type: SectionType;
  enabled: boolean;
  position: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

---

## 2. Catálogo de Seções Padrão

| Tipo de Seção | Finalidade | Configurações Típicas (`settings`) |
| :--- | :--- | :--- |
| `hero_slider` | Banners principais rotativos com CTA | `slides: [{ image_url, title, subtitle, link, button_text }]`, `autoplay: boolean`, `interval: number` |
| `stories_feed` | Destaques circulares no estilo Instagram | `items: [{ title, image_url, link, is_new }]` |
| `categories_carousel`| Grade/Carrossel de categorias | `category_ids: string[]`, `layout: 'grid' \| 'carousel'`, `show_counts: boolean` |
| `featured_products`| Vitrine de produtos em destaque | `collection_slug: string`, `limit: number`, `title: string`, `subtitle: string` |
| `promotions_grid` | Produtos em promoção ou queima de estoque | `badge_text: string`, `limit: number`, `filter: 'discount_only'` |
| `benefits_bar` | Ícones de vantagens (Frete, Parcelamento, Garantia) | `items: [{ icon: string, title: string, description: string }]` |
| `whatsapp_cta` | Bloco de atendimento direto no WhatsApp | `phone: string`, `message: string`, `title: string`, `agent_avatar: string` |
| `social_feed` | Links e integração visual com Instagram/TikTok | `instagram_handle: string`, `images: string[]` |

---

## 3. Renderizador do Section Engine (`SectionRenderer`)

O `StorefrontHome` não deve conter JSX fixo de seções. Ele delega a renderização para o `SectionRenderer`:

```tsx
interface SectionRendererProps {
  sections: StoreSection[];
  store: StoreInfo;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({ sections, store }) => {
  const activeSections = sections
    .filter(s => s.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <main className="flex flex-col gap-y-12 md:gap-y-16">
      {activeSections.map(section => {
        const Component = SECTION_COMPONENTS[section.type];
        if (!Component) return null;
        return (
          <section key={section.id} id={`section-${section.id}`} data-section-type={section.type}>
            <Component settings={section.settings} store={store} />
          </section>
        );
      })}
    </main>
  );
};
```

---

## 4. Interface Administrativa de Gestão de Seções

No painel do lojista (Dashboard → Aparência → Página Inicial):
- Lista de seções ativas com controle de arrastar e soltar (drag & drop);
- Switch para ativar/desativar cada seção individualmente;
- Botão de edição que abre Drawer lateral com os campos específicos de cada seção;
- Prévia em tempo real via `iframe` ou Live Preview.
