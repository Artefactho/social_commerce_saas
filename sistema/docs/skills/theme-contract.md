# 📐 THEME CONTRACT v1 — SaaS Commerce Theme Engine Specification

> Migrado de `/TEMPLATES MODELO LOJA/SAAS COMMERCE TEMA1 AURA MAISON JOALHERIA/` e
> adotado como a fonte oficial do Theme Contract (mais detalhado e maduro que o
> esboço conceitual do SPEC_MASTER original). Ver `ARQUITETURA_TECNICA.md` seção 5
> para como isso se encaixa na arquitetura geral, e `ROADMAP_DE_EXECUCAO.md` Fase 4
> para quando isso é implementado.

Este documento define o **contrato oficial de arquitetura e integração** entre o
**Commerce Core** (núcleo de regras de negócio, dados e serviços) e o **Theme Engine**
(camada de apresentação visual e templates) do **SaaS Commerce**.

Todos os temas atuais e futuros desenvolvidos para a plataforma devem aderir
estritamente a este contrato. O tema **Aura Maison** é a primeira implementação de
referência deste ecossistema.

---

## 1. Objetivo

O SaaS Commerce é uma plataforma multi-tenant projetada para atender milhares de
lojistas, oferecendo múltiplos templates visualmente distintos (ex: minimalista,
luxo, streetwear, eletrônicos, cosméticos, artesanal).

Para garantir escalabilidade, manutenibilidade e integridade:
- **O Tema é uma camada de apresentação pura**: Um tema é responsável exclusivamente
  pela estética, layout, tipografia, micro-interações e experiência de navegação do
  usuário.
- **Desacoplamento Total**: O Commerce Core fornece dados e métodos de mutação
  padronizados. O mesmo Commerce Core deve alimentar qualquer tema sem que uma única
  linha de regra de negócio, integração de pagamento ou autenticação precise ser
  reescrita ou duplicada.
- **Substituição Transparente de Temas**: Um lojista deve poder trocar do Tema A para
  o Tema B com um clique no painel, e todos os seus produtos, categorias, carrinho,
  clientes e pedidos continuarão funcionando perfeitamente.

---

## 2. Separação de Responsabilidades

A fronteira entre o que pertence ao **Commerce Core** e o que pertence ao **Theme** é
estrita e inegociável.

```
┌──────────────────────────────────────────────────────────────────┐
│                          COMMERCE CORE                           │
│  (Multi-Tenancy, Autenticação, Banco de Dados, APIs, RLS,         │
│   Produtos, Estoque, Pedidos, Carrinho, Frete, Gateways/Checkout)│
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Dados (Props) & Ações (Events)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                           THEME ENGINE                           │
│  (Layout, CSS/Tailwind, Tipografia, Cores, Header, Banners,      │
│   Vitrines, Cards, Modais, Drawers, Animações, Responsividade)   │
└──────────────────────────────────────────────────────────────────┘
```

### A) Commerce Core (Lógica de Negócio e Estado)
É responsável por:
1. **Identificação do Tenant**: Resolução de domínio/subdomínio, isolamento de dados
   e segurança (RLS).
2. **Catálogo de Dados**: Gerenciamento de produtos, variantes, categorias, coleções
   e níveis de estoque.
3. **Mecanismo de Carrinho & Sessão**: Validação de quantidades em estoque, cálculos
   de subtotal, descontos, regras tributárias e fretes.
4. **Clientes & Autenticação**: Login, cadastro, recuperação de senha, perfil e
   histórico de pedidos.
5. **Checkout & Pagamentos**: Tokenização de cartões, geração de PIX, boletos,
   integração com adquirentes (Stripe, Mercado Pago, Pagar.me, Asaas) e webhooks de
   confirmação.
6. **Regras Comerciais & Promoções**: Validação de cupons, regras de frete grátis por
   região/valor e limites operacionais.
7. **Persistência & APIs**: Banco de dados centralizado, chamadas REST/GraphQL e
   proteção contra fraude.

### B) Theme (Camada de Apresentação)
É responsável por:
1. **Layout & Estrutura**: Header, barras de anúncio, menus, vitrines, grades,
   rodapé e gavetas (*drawers*).
2. **Identidade Visual & Estilo**: Aplicação do `ThemeConfig` (cores, fontes, bordas,
   sombras e espaçamentos).
3. **Composição e Renderização**: Como os dados recebidos do Core (produtos,
   categorias, itens da sacola) são exibidos ao cliente final.
4. **Responsividade & Acessibilidade**: Adaptação para mobile, tablet, desktop e
   padrões WCAG AA.
5. **Micro-interações & UX**: Animações de entrada, efeitos de hover, alternância de
   galerias e feedback visual de cliques.
6. **Disparo de Eventos**: Solicitar ao Commerce Core que execute mutações (ex:
   "adicione este item", "abra o checkout").

> ⚠️ **Regra Fundamental**: O tema **NUNCA** deve implementar seu próprio banco de
> dados, sua própria autenticação de usuários, sua própria validação de estoque,
> tabelas exclusivas ou lógica de cobrança de pagamentos.

---

## 3. Theme Config / Theme Schema

O `ThemeConfig` é a estrutura de dados JSON que define as customizações visuais
permitidas por loja (Store Configuration). Ele permite que o lojista altere a
aparência sem encostar no código-fonte.

### Schema Conceitual do ThemeConfig

```typescript
export interface ThemeConfig {
  themeId: string;           // ex: "aura-luxury", "minimal-bold"
  themeVersion: string;      // ex: "1.0.0"

  branding: {
    logoUrl?: string;
    logoMonogram?: string;
    logoWidthDesktop?: number;
    faviconUrl?: string;
  };

  colors: {
    primary: string;         // Cor principal de botões e destaques (ex: "#D4AF37")
    primaryText: string;     // Cor do texto sobre a cor primária (ex: "#1C1917")
    backgroundCanvas: string;// Fundo da página (ex: "#FAF8F5")
    surfaceCard: string;     // Fundo de cards e modais (ex: "#FFFFFF")
    textPrimary: string;     // Títulos e preços (ex: "#1C1917")
    textMuted: string;       // Descrições e notas (ex: "#78716C")
    borderSubtle: string;    // Linhas e divisores (ex: "#EAE2D3")
    accentPromotion: string; // Badges de desconto (ex: "#E11D48")
  };

  typography: {
    fontFamilyHeading: string; // ex: "Playfair Display, serif"
    fontFamilyBody: string;    // ex: "Plus Jakarta Sans, sans-serif"
    headingScale: 'compact' | 'normal' | 'expressive';
  };

  geometry: {
    borderRadiusCard: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    borderRadiusButton: 'none' | 'sm' | 'md' | 'lg' | 'full';
  };

  header: {
    showTopAnnouncement: boolean;
    announcementMessages: string[];
    layoutVariant: 'logo-center-3-menus' | 'logo-left-menu-center' | 'minimal-inline';
    showSearch: boolean;
    showWishlist: boolean;
  };

  hero: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    ctaButtonText: string;
    showCategoryBadges: boolean;
    backgroundImageUrl?: string;
  };

  catalog: {
    itemsPerPage: number;
    columnsDesktop: 2 | 3 | 4 | 5;
    enableQuickView: boolean;
    showStockBadge: boolean;
    showRating: boolean;
  };

  footer: {
    showNewsletter: boolean;
    newsletterTitle?: string;
    aboutText?: string;
    columns: {
      title: string;
      links: { label: string; url: string }[];
    }[];
  };
}
```

---

## 4. Dados Fornecidos pelo Commerce Core ao Tema

```typescript
export interface Store {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  currency: string;             // ex: "BRL", "USD"
  currencySymbol: string;       // ex: "R$", "$"
  whatsappNumber?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  order: number;
}

export interface ProductVariantOption {
  name: string;                 // ex: "Cor", "Tamanho"
  value: string;                // ex: "Ouro Amarelo", "G"
  colorHex?: string;            // ex: "#D4AF37"
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  compareAtPrice?: number;      // Preço original "de"
  inventoryQuantity: number;
  available: boolean;
  options: ProductVariantOption[];
  imageUrl?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  descriptionHtml?: string;
  price: number;                // Menor preço ativo
  compareAtPrice?: number;      // Preço de referência "De" para "Por"
  images: string[];
  categoryId: string;
  categoryName: string;
  variants: ProductVariant[];
  available: boolean;
  totalInventory: number;
  tags: string[];               // ex: ["lancamento", "exclusivo"]
  rating?: number;
  reviewsCount?: number;
  attributes?: Record<string, string>;
}

export interface CartItem {
  id: string;                   // ID da linha no carrinho
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemsCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  appliedCoupon?: {
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
  };
  freeShippingRule?: {
    eligible: boolean;
    minimumThreshold: number;
    remainingAmount: number;
  };
}

export interface Wishlist {
  productIds: string[];
  products: Product[];
  count: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
```

---

## 5. Theme Interface (Estrutura Conceitual do Tema)

```typescript
export interface ThemeRendererProps {
  store: Store;
  themeConfig: ThemeConfig;
  categories: Category[];
  products: Product[];
  featuredProducts: Product[];
  currentCategory?: Category;
  currentProduct?: Product;
  cart: Cart;
  wishlist: Wishlist;
  customer?: Customer;
  actions: ThemeActions;
}

export interface ThemeModule {
  themeId: string;
  themeName: string;
  version: string;

  renderLayout: React.FC<ThemeRendererProps>;
  renderHeader: React.FC<ThemeRendererProps>;
  renderHero: React.FC<ThemeRendererProps>;
  renderCatalog: React.FC<ThemeRendererProps>;
  renderProductCard: React.FC<{ product: Product; config: ThemeConfig; actions: ThemeActions }>;
  renderProductDetail: React.FC<ThemeRendererProps>;
  renderCartDrawer: React.FC<ThemeRendererProps>;
  renderWishlistDrawer: React.FC<ThemeRendererProps>;
  renderFooter: React.FC<ThemeRendererProps>;
}
```

---

## 6. Ações e Eventos (ThemeActions)

```typescript
export interface ThemeActions {
  addToCart: (params: { productId: string; variantId?: string; quantity?: number }) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateCartQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;

  toggleWishlist: (productId: string) => void;
  openWishlist: () => void;
  closeWishlist: () => void;

  selectCategory: (categoryId: string) => void;
  searchProducts: (query: string) => void;
  setSortOrder: (sort: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name') => void;
  openProductQuickView: (product: Product) => void;
  closeProductQuickView: () => void;
  navigateToProductPage: (productSlug: string) => void;

  openCheckout: () => void;
  startWhatsAppOrder: (options?: { customNotes?: string }) => void;
}
```

---

## 7. Multi-Tenancy

```
┌────────────────────────────────────────────────────────┐
│               SaaS Theme Engine Engine                 │
│         (1 Único Bundle de Código de Temas)            │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   [ Lojista 01 ]     [ Lojista 02 ]     [ Lojista 03 ]
   - Subdomínio A     - Subdomínio B     - Subdomínio C
   - Tema: Aura       - Tema: Aura       - Tema: Streetwear
   - ThemeConfig A    - ThemeConfig B    - ThemeConfig C
   - Produtos A       - Produtos B       - Produtos C
```

---

## 8. Regras Obrigatórias para Novos Temas

### ✅ O que o Novo Tema DEVE fazer:
- [ ] Implementar as interfaces conceituais do **Theme Contract v1**.
- [ ] Obter todas as cores, fontes, bordas e textos editáveis exclusivamente através
      do `ThemeConfig`.
- [ ] Consumir produtos, categorias, carrinho e estoque exclusivamente via `props`.
- [ ] Disparar mutações exclusivamente através da interface `ThemeActions`.
- [ ] Garantir responsividade fluída de 320px até 2560px.
- [ ] Exibir estados de carregamento e estados vazios para buscas e sacola vazia.
- [ ] Respeitar acessibilidade básica: contraste WCAG AA.

### ❌ O que o Novo Tema NUNCA DEVE fazer:
- [ ] **NÃO** criar conexões diretas com banco de dados.
- [ ] **NÃO** implementar fluxos próprios de autenticação ou login no código do tema.
- [ ] **NÃO** criar lógica própria de cobrança de cartão ou chave PIX dentro de
      componentes do tema.
- [ ] **NÃO** gravar regras de negócio ou limites de frete/estoque fixos no código.
- [ ] **NÃO** depender de nomes fixos de produtos vinculados a uma loja específica.
- [ ] **NÃO** armazenar estados críticos de vendas no `localStorage` sem sincronização
      com o Core.

---

## 9. Tratamento de LocalStorage & Estado de Sessão

| Dado | Responsabilidade no SaaS | Justificativa |
| :--- | :--- | :--- |
| **Itens do Carrinho** | **Commerce Core** (API / Sessão) | O Commerce Core valida estoque em tempo real, aplica promoções centralizadas e sincroniza entre dispositivos. |
| **Lista de Desejos** | **Commerce Core + Local Storage** | Pode residir localmente para anônimos e sincronizar após login. |
| **Rascunho de Tema (Customizer)** | **Local Storage / Session Storage** | O painel do lojista armazena o preview temporário antes de publicar. |

---

## 10. Compatibilidade e Versionamento (Theme Contract v1)

1. **Versionamento Semântico (`v1`, `v2`)**: Adições ao `ThemeConfig` ou `Product` são
   opcionais (`?`), garantindo compatibilidade retroativa.
2. **Fallback Gracioso**: Valores padrão (*default fallbacks*) no código para
   qualquer campo não preenchido no `ThemeConfig`.

---

## 11. Implementação de Referência — Aura Maison

Base: `aura-maison---catálogo-premium.zip` (React 19 + Vite + TS), adaptado na Fase 4
do roadmap para consumir `ThemeRendererProps`/`ThemeActions` reais em vez de estado
local (`useState`+`localStorage`) e dados mockados.

| Componente Atual | Papel Arquitetural no Theme Contract |
| :--- | :--- |
| `TopBanner.tsx` | Apresentação visual alimentada por `themeConfig.header`. |
| `Header.tsx` | Cabeçalho visual com logo central redonda e 3 menus. Consome `categories` e dispara ações. |
| `HeroCatalogBanner.tsx` | Seção editorial de destaque alimentada por `themeConfig.hero`. |
| `FeaturesBar.tsx` | Barra de garantias institucionais. |
| `CatalogSection.tsx` | Grade responsiva de catálogo. Consome `products` e `categories`. |
| `ProductCard.tsx` | Card visual de produto. Dispara `actions.addToCart` e `actions.toggleWishlist`. |
| `ProductModal.tsx` | Visualização rápida/detalhada com variantes de `Product`. |
| `CartDrawer.tsx` | Gaveta visual do carrinho. Apresenta `Cart` e dispara ações. |
| `WishlistDrawer.tsx` | Gaveta de favoritos com `Wishlist`. |
| `CheckoutModal.tsx` | Interface de apresentação (no SaaS, conectado à API do Core). |
| `Footer.tsx` | Rodapé com colunas institucionais alimentado por `themeConfig.footer`. |
| `Toast.tsx` | Notificação flutuante de feedback de ações. |

---

## 12. Critérios de Teste de Compatibilidade para o "Tema 02"

1. **Troca sem Alteração de Código Core**: O mesmo Commerce Core deve alimentar o
   Tema 02 apenas trocando o identificador do tema.
2. **Visual Completamente Diferente**: Layouts, tipografias, cantos retos ou paletas
   escuras/monocromáticas diferentes.
3. **Paridade de Ações**: `addToCart`, `openCheckout`, filtros e buscas devem
   funcionar de forma idêntica.

Ver `ARQUITETURA_TECNICA.md` seção 5 para a lista de candidatos futuros de tema
(protótipos visuais em `/TEMPLATES MODELO LOJA`, hoje apenas referência de design).

---

## 13. Checklist para adaptar um novo template visual

Escrito depois de transformar o segundo template estático de referência
(`gemini-code-1787034988017.html`, "Aurea Joalheria") no tema real
`frontend/src/features/theme/aurea-joalheria/` — o primeiro caso que exercitou de
verdade os "Critérios de Teste de Compatibilidade para o Tema 02" da seção 12 acima,
até então só teóricos. Os 10 critérios de validação (residual de conteúdo fictício,
paleta, tipografia, carrinho, checkout, quick view, wishlist, console limpo) todos
`PASS` via Playwright numa loja de nicho deliberadamente diferente (eletrônicos).
Use isto como checklist para o 3º/4º/5º template de `/TEMPLATES MODELO LOJA`.

**1. Extraia só identidade visual do HTML/CSS estático — nunca copie o
arquivo e faça find-replace nele.** Leia o template de referência procurando
especificamente: paleta de cores (ler as variáveis CSS `:root`, não os usos
espalhados), fontes (`@import`/`<link>` do Google Fonts), e os padrões de layout de
header/card/drawer. Todo o resto do arquivo (marcação HTML, JS de interação,
conteúdo de exemplo) é referência a descartar, não a portar.

**2. Escreva os componentes do zero, espelhando a estrutura de arquivos do tema já
existente** (`TopBanner`, `Header`, `HeroCatalogBanner`, `FeaturesBar`,
`CatalogSection`, `ProductCard`, `ProductQuickViewModal`, `CartDrawer`,
`WishlistDrawer`, `Footer`, e um orquestrador `<Nome>Storefront.tsx`), com os mesmos
formatos de prop (`ThemeCategory`, `ThemeColors` — hoje só `{ primary,
accentPromotion }`, que é tudo que `store_theme_configs.config.colors` realmente
suporta; não implemente o `ThemeConfig` completo e aspiracional da seção 3 deste
documento, ele ainda não existe na prática) e os mesmos hooks reais
(`useCart`/`useWishlist`). Checkout sempre `navigate("/checkout")` real, nunca um
checkout duplicado dentro do tema.

**3. Reaproveite as strings de copy já genéricas do tema anterior em vez de
escrever textos de marketing novos.** Esta foi a decisão de maior redução de risco
do processo: a *identidade* de um novo tema deve vir do sistema visual (paleta,
tipografia, forma do card/header), não de copy reescrito. Textos como "Descubra o
melhor de {storeName}", os 4 itens do `FeaturesBar`, as mensagens do `TopBanner` e o
texto de carrinho vazio já foram revisados e validados como neutros — reescrevê-los
por tema arrisca reintroduzir uma suposição de nicho (ex.: um selo "Diamante
Certificado" ou um rótulo "Cofre de Compras" que fariam sentido numa loja de joias
mas pareceriam fora de contexto numa loja de eletrônicos). Elementos decorativos do
template original sem correspondência em dado real (selos fixos por produto, formas
CSS decorativas usadas só porque o mock não tinha foto de verdade) devem ser
descartados, não adaptados — o produto real já tem `images[0]`.

**4. Tipografia própria do tema, sem tocar configuração global.** Se a fonte do
template de referência for diferente da fonte global do app (`--font-heading`/
`--font-sans` em `index.css`, hoje Space Grotesk/Plus Jakarta Sans — conferir antes
de assumir), carregue a fonte do Google Fonts só para este tema via um `<link>`
injetado em `useEffect` no orquestrador (com um `id` único para não duplicar em
re-render), e sobrescreva a classe utilitária `font-heading` só dentro de um
wrapper com classe própria do tema, usando um seletor de duas classes
(`.tema-root .font-heading { font-family: ... }`) — a especificidade maior garante
a prioridade sem precisar de `!important` e sem editar `tailwind.config.ts` (que é
global e afetaria Dashboard, landing e outros temas).

**5. Nenhuma migration nova é necessária** — ativação continua sendo
`store_theme_configs.config.themeId`. A aba "Tema" do Dashboard ainda não lista
temas além de "Padrão"/"Aura Maison" (hardcoded); adicionar um novo tema à lista
visível pro lojista é uma decisão de produto separada, fora do escopo deste
checklist técnico — hoje só é possível ativar um tema novo via SQL direto.

**6. Validação, mesmo rigor do Aura Maison (Fase 4.1):**
- `npx tsc --noEmit` limpo.
- `npm run build` sem erro novo (avisos pré-existentes do projeto, como o de
  `@import` em `index.css`, não contam).
- `npm run lint` sem categoria de erro nova (comparar a contagem total com a
  baseline documentada em `PROGRESS.md`).
- E2E em navegador real numa loja de nicho **deliberadamente diferente** do
  template de referência — só assim um resíduo de conteúdo fictício fica óbvio por
  contraste. Testar, no mínimo: zero termos do template original na página
  renderizada; nome/categoria/produto reais aparecem; paleta e tipografia do novo
  tema aplicadas de verdade (computed style, não só visual); adicionar ao
  carrinho atualiza contador; drawer do carrinho mostra o item real e o botão de
  checkout navega para `/checkout` de verdade; quick view abre com dado real;
  favoritar funciona; zero erros de console.
- Ambiente de validação local: `supabase start` + `supabase db reset` (Docker
  precisa estar rodando), loja de teste inserida direto via SQL (mais rápido que
  passar pelo fluxo de cadastro), Playwright dirigindo um Chromium real. Se não
  houver `chromium-cli`/Playwright já disponível no ambiente, instalar num
  projeto Node descartável fora de `frontend/` (não editar o `package.json` da
  aplicação só para uma validação pontual). Encerrar tudo ao final:
  `.env.local` removido, dev server parado, `supabase stop`.
