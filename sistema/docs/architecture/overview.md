# Arquitetura Oficial — Visão Geral (Overview)

> **Status:** Especificação Oficial Aprovada para Implementação  
> **Stack:** React 18+ · TypeScript · Vite · Tailwind CSS / CSS Variables · Supabase (PostgreSQL + RLS + Auth + Storage + Edge Functions)  
> **Catálogo de Temas:** 5 Temas Oficiais (Base Theme, Aura Maison, Áurea Joalheria, Jô Perfumes, Minimal Clean)

---

## 1. Princípio Fundamental de Separação de Camadas

A arquitetura do **Social Commerce SaaS** é estruturada em 6 domínios independentes e desacoplados:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PLATFORM (Cross-Cutting)                        │
│             SEO / MetaTags · Analytics · i18n · Global Config               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                                STORE ENGINE                                 │
│       Layouts · Pages · Section Engine · Dynamic Home · Store States        │
└──────────────┬───────────────────────────────────────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌──────────────────────────────┐               ┌──────────────────────────────┐
│       COMMERCE ENGINE        │               │       CUSTOMER ENGINE        │
│ Products · Catalog · Cart    │               │ Auth · Profile · Addresses   │
│ Pricing · Shipping · Orders  │               │ Orders History · Wishlist    │
└──────────────┬───────────────┘               └───────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                THEME ENGINE                                 │
│                               Theme Registry                                │
│   [Base Theme]  [Aura Maison]  [Áurea Joalheria]  [Jô Perfumes]  [Minimal]  │
│        Design Tokens · Colors · Typography · Section Renderers              │
│                 (NENHUMA REGRA COMERCIAL DENTRO DO TEMA)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                            DESIGN SYSTEM CORE                               │
│      Button · Input · Select · Modal · Drawer · Card · Toast · Skeleton     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Responsabilidade por Domínio

| Domínio | Responsabilidade Primária | O que NÃO deve conter |
| :--- | :--- | :--- |
| **Store Engine** | Composição da loja, roteamento de páginas (`/`, `/produtos`, `/produto/:slug`, `/sobre`), orquestração do Section Engine e estados da loja (`ACTIVE`, `MAINTENANCE`, `COMING_SOON`, `PRIVATE`). | Lógica de cálculo de impostos/frete, markup visual proprietário. |
| **Commerce Engine** | Modelagem de catálogo, queries com filtros/ordenação (`ProductQuery`), cálculo de carrinho (`CartEngine`), motor de frete (`ShippingEngine`), checkout e validação de pedidos. | Elementos de UI/JSX, classes Tailwind diretas. |
| **Customer Engine** | Autenticação do cliente final da loja (diferente da conta do lojista), gestão de perfil, múltiplos endereços e histórico de compras. | Lógica do painel administrativo SaaS do lojista. |
| **Theme Engine** | Registro dos 5 temas oficiais, injeção de variáveis CSS (`--theme-primary`, `--theme-bg`, etc.), escalas tipográficas e renderizadores visuais de seções. | Chamadas de API, cálculo de frete, mutação de banco de dados. |
| **Platform** | Metadados OpenGraph/Twitter, gerador de JSON-LD Schema.org, i18n, analytics (Pixel Facebook, TikTok Pixel, GA4). | Componentes visuais acoplados a nichos específicos. |
| **Design System** | Biblioteca de componentes atômicos puros e acessíveis (Radix UI + Tailwind). | Chamadas diretas ao Supabase ou dependências de contexto de loja. |

---

## 3. Fluxo de Dados Unidirecional

1. O **Store Engine** carrega a configuração da loja (`stores`, `store_theme_configs`, `store_sections`).
2. O **Theme Engine** consulta o `Theme Registry` e aplica os tokens de design do tema ativo no container raiz (`CSS Variables`).
3. O **Commerce Engine** provê os dados tipados via Hooks (`useProductListing`, `useCart`, `useShippingCalculator`).
4. O **Section Engine** renderiza a Home dinamicamente com base nas seções ativadas pelo lojista.
5. O **Checkout** valida todos os preços no servidor (Edge Function) antes de gerar o payload de pagamento.
