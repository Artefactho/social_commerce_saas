# Princípios Arquiteturais & Memória de Decisão — Social Commerce SaaS

> **Status:** Documento Oficial de Memória Arquitetural Permanente  
> **Última Atualização:** 26 de Setembro de 2026  
> **Objetivo:** Registrar de forma perene os princípios, a correspondência conceitual, as decisões tomadas, as decisões abertas e as regras de governança arquitetural do projeto.

---

## 1. Princípios Arquiteturais Fundamentais

A arquitetura do **Social Commerce SaaS** foi estruturada sob princípios de alta coesão, baixo acoplamento e separação rígida de responsabilidades:

1. **Separação Rígida de Camadas:** O sistema é dividido em 6 domínios independentes: `STORE ENGINE`, `COMMERCE ENGINE`, `CUSTOMER ENGINE`, `THEME ENGINE`, `PLATFORM` e `DESIGN SYSTEM`.
2. **Theme Engine Sem Regra de Negócio:** Temas cuidam **exclusivamente** de tokens de design (cores, tipografia, espaçamentos, bordas, variações visuais). Um tema nunca calcula preços, fretes, impostos ou realiza chamadas diretas de mutação no banco de dados.
3. **Section Engine para Composição Dinâmica:** A página inicial da loja não é um layout rígido ou hardcoded. Ela é composta por um array de seções (`sections[]`) que o lojista pode ativar, desativar, configurar e reordenar.
4. **Reutilização Universal de Componentes:** Componentes cuja responsabilidade essencial é a mesma (como `ProductCard`, `ProductGrid`, `PriceDisplay`, `CartDrawer`) são únicos e universais. Não se criam cópias de componentes para contextos diferentes (Home vs. Categoria vs. Busca vs. Relacionados).
5. **Cart Engine Único com Múltiplas Apresentações:** O motor de estado e cálculo do carrinho é único (`CartEngine`). Ele alimenta simultaneamente o `CartDrawer` (gaveta lateral), a `CartPage` (página dedicada) e os badges de contagem no cabeçalho.
6. **Checkout como Domínio Próprio e Seguro:** O checkout orquestra coleta de dados, endereço, frete e pagamento. **Nenhum valor total enviado pelo cliente é considerado confiável**; a validação final de preços ocorre no servidor.
7. **Shipping Engine Unificado:** O cálculo de frete possui regras centralizadas (incluindo a regra de isenção total de frete para produtos 100% digitais) e alimenta a PDP, o Carrinho e o Checkout.
8. **Abstração de Pagamentos (`IPaymentProvider`):** Gateways de pagamento (Mercado Pago, Asaas, Stripe, Pagar.me) são desacoplados através de uma interface comum e intercambiável com processamento assíncrono via Webhooks.
9. **SEO e Social Metadata como Capacidade de Plataforma:** O controle de metatags, OpenGraph dinâmico, Twitter Cards e Schema.org JSON-LD pertence à camada `Platform`, nunca aos temas individuais.
10. **Social Commerce como Requisito Central:** A plataforma é otimizada prioritariamente para o tráfego originado de redes sociais (Instagram, TikTok, WhatsApp). Isso exige URLs estáveis de produtos, deep links, checkout ultra-rápido (Guest Checkout), botão de fechar pedido no WhatsApp e experiência Mobile-First de alta velocidade.
11. **Performance e Carregamento Progressivo:** Imagens responsivas, lazy loading nativo, skeletons de loading e isolamento de dependências pesadas para garantir notas máximas no Core Web Vitals.

---

## 2. Correspondência Conceitual com a Referência Estudada

A análise da arquitetura clássica do Nuvemshop Base Theme serviu como referência de engenharia de e-commerce maduro, traduzida para a stack moderna (**React + TypeScript + Vite + Tailwind CSS + Supabase**):

| Conceito Nuvemshop (Referência) | Equivalente Moderno no Social Commerce SaaS | Papel e Responsabilidade |
| :--- | :--- | :--- |
| `Twig / .tpl Templates` | **React Components (TSX)** | Renderização declarativa com tipagem estática e reatividade. |
| `Templates de Página` | **Pages / Routes (`react-router-dom`)** | Páginas canônicas (`/`, `/produtos`, `/categoria/:slug`, `/p/:productSlug`). |
| `Layout (`layout.tpl`)` | **`StoreLayout` / `CustomerLayout`** | Shell estrutural com Header, Footer, Providers e Drawer global. |
| `Snipplets` | **Design System / Reusable Commerce Components** | Componentes atômicos e blocos reutilizáveis (`ProductCard`, `QuickShopModal`). |
| `Settings (`config.json`)` | **`StoreThemeConfig` (JSONB / TypeScript Type)** | Configurações tipadas de identidade visual da loja salvas no PostgreSQL. |
| `Sections` | **`Section Engine` (`StoreSection` + `SectionRenderer`)** | Blocos modulares independentes e ordenáveis da Home. |
| `Store / Commerce Backend` | **Commerce Services / Supabase Edge Functions** | APIs seguras, queries tipadas com filtros (`ProductQuery`) e validações de regras. |
| `Theme Engine` | **`Theme Engine` (CSS Variables Injection)** | Injeção de variáveis CSS (`--theme-primary`, `--theme-bg`) no container raiz. |

> *Nota: Nenhuma dependência antiga (jQuery, Twig, PHP) foi adotada. O projeto aproveita apenas a solidez dos conceitos de desacoplamento.*

---

## 3. Decisões Já Tomadas (Imutáveis sem Motivo Técnico)

1. **Stack de Apresentação:** React 18+ com TypeScript, Vite e Tailwind CSS / CSS Variables.
2. **Infraestrutura e BaaS:** Supabase (PostgreSQL com Row Level Security, Supabase Auth para lojistas, Supabase Storage para mídias de produtos e Edge Functions para regras de negócio seguras).
3. **Modelo Multi-Tenant:** Hierarquia `User` → `Organization` → `N Stores`, com políticas de RLS garantindo isolamento estrito de dados por loja.
4. **Theme Contract Único:** Os temas não possuem arquivos de componentes duplicados. Todos os temas são instâncias de configurações visuais consumidas pelos componentes universais do Design System.
5. **Frete para Produtos Digitais:** Produtos do tipo `digital` (infoprodutos, arquivos, ingressos) são isentos de frete em qualquer etapa da loja.
6. **Segurança de Pedidos:** A gravação final de pedidos no checkout com validação de preço é de responsabilidade de Edge Function no servidor, eliminando fraude de manipulação de payload no cliente.

---

## 4. Decisões Ainda Abertas

1. **Estratégia de Gateway Primário de Pagamento:** Escolha entre Mercado Pago (foco Brasil / Pix rápido) vs. Asaas (Split de pagamento transparente para SaaS) vs. Stripe (internacionalização futura).
2. **Estratégia de Renderização para SEO:** Avaliar transição futura de SPA com Meta Injection dinâmico para SSR/SSG (ex: Remix ou Next.js / Cloudflare Workers) caso a indexação orgânica exija HTML pré-renderizado no servidor para bots antigos.
3. **Mecanismo de Subdomínios / Domínios Personalizados:** Definir se a resolução de domínios próprios (`lojadocliente.com.br`) será feita via Cloudflare for SaaS ou roteamento reverso no Vercel/Supabase.
4. **Editor Visual da Home (Storefront Customizer):** Escolher o modelo de UX para o lojista personalizar a Home no Dashboard (Drawer de campos simples vs. Live Preview em iframe bidirecional com `postMessage`).

---

## 5. Arquitetura Alvo (Target Architecture)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PLATFORM (Cross-Cutting)                        │
│          SEO/MetaTags · OpenGraph · Analytics · i18n · Global Config        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                                STORE ENGINE                                 │
│        StoreLayout · Roteamento (/p/:slug, /categoria) · Store States       │
│        SECTION ENGINE: Home = sections[type, enabled, position, settings]  │
└──────────────┬───────────────────────────────────────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌──────────────────────────────┐               ┌──────────────────────────────┐
│       COMMERCE ENGINE        │               │       CUSTOMER ENGINE        │
│ ProductQuery · useCart       │               │ End-Customer Auth · Profile  │
│ ShippingEngine · Checkout    │               │ Addresses · Orders Tracking  │
│ (Validação Server-Side)      │               │ (Separado da conta lojista)  │
└──────────────┬───────────────┘               └───────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                THEME ENGINE                                 │
│     Design Tokens (--theme-primary, --font-heading) · ThemeProvider         │
│                 (NENHUMA REGRA COMERCIAL DENTRO DO TEMA)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                            DESIGN SYSTEM CORE                               │
│      Button · Input · Select · Modal · Drawer · Card · Toast · Skeleton     │
│      ProductCard · ProductGrid · QuickShop · CartDrawer · CouponInput       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Estado Atual do Código & Gap Analysis de Referência

O código atual no repositório ainda possui dívidas da transição do export original do Lovable:
- Há duplicações de arquivos de storefronts entre temas;
- O `Dashboard.tsx` opera como um monolito de 1.363 linhas;
- O `Checkout.tsx` faz inserção direta no banco sem validação server-side;
- A Home de cada loja ainda não utiliza o `SectionRenderer`.

Para o inventário completo e detalhado das discrepâncias, consulte sempre o documento complementar:
👉 [`docs/architecture/architecture-gap-analysis.md`](file:///c:/Users/Artefactho/Documents/GitHub/social_commerce_saas/sistema/docs/architecture/architecture-gap-analysis.md).

---

## 7. Regras para Futuras Implementações

Antes de escrever qualquer código novo no projeto, **toda funcionalidade deve ser classificada estritamente no seu domínio**:

- **Regras comerciais, descontos, catálogo e carrinho** → `Commerce Engine` (`src/features/commerce/`);
- **Autenticação, perfil e histórico do comprador final** → `Customer Engine` (`src/features/customer/`);
- **Cores, fontes, tokens visuais e renderizadores cosméticos** → `Theme Engine` (`src/features/theme/`);
- **Roteamento de loja, layouts de página e blocos da Home** → `Store Engine` / `Section Engine` (`src/features/store/`);
- **Metatags, pixels de rastreamento, SEO e i18n** → `Platform` (`src/features/platform/`);
- **Componentes visuais atômicos sem lógica de negócio** → `Design System` (`src/components/ui/` ou `src/components/commerce/`).

---

## 8. Architectural Context History

### Registro 01 — 26/09/2026: Consolidação da Arquitetura Pós-Auditoria
- **Motivação:** Consolidação dos requisitos do Social Commerce SaaS a partir da análise dos princípios arquiteturais do Nuvemshop Base Theme, combinada com a auditoria adversarial do código herdado do Lovable.
- **Decisão:** Unificação do Theme Contract via CSS Variables, criação formal dos 6 domínios arquiteturais, eliminação de duplicações de componentes de vitrine e introdução do Section Engine para a Home dinâmica.
- **Autor/Agente:** Antigravity AI (Pairs com o Arquiteto do Projeto).
