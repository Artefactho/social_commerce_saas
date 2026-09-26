# Arquitetura Técnica — SaaS Social Commerce

Este documento é a fonte de verdade sobre **como o produto é construído**: stack,
decisões de infraestrutura, isolamento multi-tenant, modelo de dados e o contrato do
Theme Engine. A visão de produto (o quê e para quem) vive em
`VISAO_E_MODELO_DE_NEGOCIO.md`; a ordem de entrega vive em `ROADMAP_DE_EXECUCAO.md`.

Todas as decisões estruturais abaixo têm um ADR completo em `adr/0001-*.md` a
`adr/0006-*.md` — este documento resume a decisão e a justificativa; o ADR guarda o
contexto completo, as opções comparadas e as consequências.

---

## 1. Diagrama de arquitetura

```text
┌─────────────────────────────────────────────────────────────────┐
│ Frontend — React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui │
│ + Zustand (carrinho/wishlist) + TanStack Query (uso real, não    │
│ só instanciado) + React Router v6                                │
│  - Dashboard lojista, Onboarding, Vitrine pública /store/:slug,  │
│    Checkout, Auth — reaproveitados do código Lovable existente,  │
│    com refactor de tipagem e remoção do lixo mapeado             │
└───────────────────────────┬───────────────────────────────────────┘
                            │ supabase-js (RLS aplicado no banco)
┌───────────────────────────▼───────────────────────────────────────┐
│ Supabase (Cloud tier FREE no MVP → self-host AWS na escala)       │
│  - Postgres + RLS (isolamento primário) — baseline squashada      │
│  - GoTrue (Auth) — reaproveitado integralmente                    │
│  - Storage (bucket `products` + RLS por pasta) — reaproveitado    │
│  - Edge Functions (Deno) — NOVO: webhook Pix, PaymentService,      │
│    operações admin cross-tenant, regras de negócio server-side    │
└─────────────────────────────────────────────────────────────────┘
                            │
                  AWS Amplify Hosting (frontend)
```

## 2. As 6 decisões de arquitetura (ADRs)

| ADR | Decisão | Por quê (resumo) |
|---|---|---|
| [0001 — Stack geral](adr/0001-stack-geral.md) | Manter frontend React+Vite+TS+Tailwind+shadcn+Zustand+TanStack Query (passar a usar de fato). Backend = Supabase (Postgres+RLS+PostgREST+GoTrue+Storage) + Edge Functions novas para tudo privilegiado | Reaproveita 100% do frontend validado; RLS já satisfaz a regra de isolamento sempre-no-banco |
| [0002 — Multi-tenancy](adr/0002-multi-tenancy.md) | RLS nativo do Postgres, com defesa em profundidade nas Edge Functions; squash das 28 migrations numa baseline + novas tabelas `organizations`/`organization_members` | Escala para milhares de lojas; filtro só na aplicação é exatamente o que a regra #1 do `CLAUDE.md` proíbe |
| [0003 — Autenticação](adr/0003-autenticacao.md) | Manter Supabase Auth (GoTrue) | Já funcional; toda RLS já usa `auth.uid()`; migrar para Cognito exigiria reescrever tudo sem ganho |
| [0004 — Storage](adr/0004-storage.md) | Manter Supabase Storage (bucket `products`, RLS por pasta) | Zero retrabalho; já é compatível com S3 por baixo, migração futura não exige reescrever o frontend |
| [0005 — Pagamentos](adr/0005-pagamentos.md) | `PaymentService` como adapter; primeiro gateway = Mercado Pago (Pix + Connect/OAuth), webhook em Edge Function dedicada | Pix da venda cai na conta do próprio lojista, não do SaaS |
| [0006 — Deploy/hospedagem](adr/0006-deploy.md) | AWS em 2 sub-fases: MVP = AWS Amplify (frontend) + Supabase Cloud tier FREE (backend gerenciado) — **não** um backend nativo AWS ainda. Migração para self-host AWS (EC2/ECS Fargate + RDS, `sa-east-1`) só na Fase 8 | Trade-off deliberado de velocidade/custo; VPS não tem datacenter no Brasil e implicaria retrabalho garantido depois |

## 3. Isolamento multi-tenant, RBAC e segurança

Regra mais inegociável de todo o projeto (preservada do `SPEC_MASTER` original, §39,
§43, §71, §89-93): **um tenant nunca acessa dado de outro tenant, em nenhuma
circunstância.** Isso vale para toda leitura/escrita, direta ou agregada (dashboards,
buscas, exportações, cache, storage, webhooks).

- **Onde o isolamento é garantido**: no banco, via RLS do Postgres — nunca só no
  frontend, nunca só em uma camada de filtro de aplicação (ver ADR-0002).
- **Defesa em profundidade**: toda Edge Function que executa uma ação privilegiada
  revalida `organization_id`/`store_id` a partir do contexto autenticado, nunca a
  partir do payload enviado pelo cliente.
- **RBAC**: papéis dentro de uma organização (`owner/admin/manager/staff`, hoje
  inexistente no código — ver seção 4) e papéis administrativos do SaaS
  (`master_admin/support_admin/billing_admin`, separados e nunca confundidos com papéis
  de organização — o admin do SaaS enxerga todas as organizações, mas nenhum `owner`
  de organização enxerga outra organização).
- **IDOR**: qualquer endpoint que recebe um ID direto (produto, pedido, cliente) deve
  validar que aquele ID pertence ao tenant da sessão atual antes de responder — nunca
  confiar que o ID é "provavelmente" do tenant certo.
- **Teste mais importante do projeto**: Tenant A tentando acessar qualquer dado do
  Tenant B deve sempre responder `403`/`404`, nunca `200 OK`. A bateria completa desse
  teste, com o cenário de dados padrão, está em `SEED_DATA.md` e nos critérios de cada
  fase em `ROADMAP_DE_EXECUCAO.md`.

## 4. Modelo de dados — o que existe hoje e o que é novo

O código Lovable avaliado (`SISTEMA SOCIAL COMMERCE/grace-and-grove-main`) já tem um
schema real e funcional, via 28 migrations Supabase. Confirmado lendo
`src/integrations/supabase/types.ts` e o schema gerado:

**Reaproveitado (existe e funciona hoje):** `stores` (tenant, com `owner_id`, `slug`
único, `plan_id`, `active_template_id`), `products` (FK `store_id`), `orders`/
`order_items`, `plans`, `templates` (`layout_key`: minimal/bold/premium),
`store_templates` (junção), `user_roles` (hoje **global**, não por loja).

**Novo (não existe no schema atual, é construção real, não ajuste incremental):**
- `organizations` + `organization_members` — a hierarquia `User→Organization→Stores`
  não existe hoje; `stores.owner_id` aponta direto para `auth.users`.
- `customers` — hoje `orders` guarda `customer_name/email/phone` inline (checkout tipo
  "guest"); um cadastro de cliente de verdade é novo.
- `categories` — hoje `products.category` é uma string solta, sem FK.
- `products.product_type` (`physical`/`digital`) — não existe; `stores.shipping_fee`
  é um valor único fixo por loja, não condicional por produto. Esta é a peça de
  trabalho mais importante do Commerce Core, porque a regra #2 do `CLAUDE.md`
  (frete condicional) depende dela.
- RBAC por loja (`organization_members.role`) — hoje `user_roles` é global
  (`admin`/`user`), sem `store_id`/`organization_id`.

**Dívida técnica a resolver antes de evoluir o schema**: das 28 migrations atuais,
cerca de 15 são histórico de tentativa-e-erro depurando RLS/grants em
`orders`/`order_items` (habilita/desabilita RLS repetidamente). Squash recomendado
numa baseline única e documentada — ver checkpoint de segurança no
`ROADMAP_DE_EXECUCAO.md` Fase 1 (nunca aplicar a baseline nova a um projeto Supabase
real sem validar primeiro localmente).

## 5. Theme Engine e Store Configuration

O contrato completo — interfaces `ThemeConfig`, `ThemeModule`, `ThemeActions`, e os
tipos de domínio compartilhados (`Store`, `Category`, `Product`, `Cart`, `Wishlist`,
`Customer`) — vive em **`skills/theme-contract.md`**, adotado como está a partir do documento
já escrito em `/TEMPLATES MODELO LOJA/SAAS COMMERCE TEMA1 AURA MAISON JOALHERIA/`
(mais maduro e detalhado que o esboço conceitual do `SPEC_MASTER` original).

Resumo da regra estrutural: três camadas rigidamente separadas desde a Fase 1 do
roadmap, mesmo com um único tema oficial (Aura Maison) no MVP —

- **Commerce Core**: dados e lógica de negócio, independente de tema.
- **Theme**: código visual, pacote independente, nunca duplicado por loja.
- **Store Configuration**: personalização por tenant (logo, cores, produtos, menus),
  armazenada como dado (`ThemeConfig` por loja), nunca hardcoded no código do tema.

**Tema 1 oficial (Aura Maison)**: a implementação de referência em
`aura-maison---catálogo-premium.zip` (React 19+Vite+TS, componentes `TopBanner`,
`Header`, `HeroCatalogBanner`, `FeaturesBar`, `CatalogSection`, `ProductCard`,
`ProductModal`, `CartDrawer`, `WishlistDrawer`, `CheckoutModal`, `Footer`, `Toast`,
`AboutModal`) vira a base do tema oficial. Hoje é standalone (estado local via
`useState`+`localStorage`, dados mockados) — o trabalho da Fase 4 é adaptar esses
componentes para consumir `ThemeRendererProps`/`ThemeActions` do Commerce Core real,
mantendo a identidade visual e a composição de componentes como estão.

### Candidatos futuros de tema (referência de design apenas, não integrar antes de haver demanda)

| Arquivo (`/TEMPLATES MODELO LOJA`) | Identidade visual | Reaproveitável como |
|---|---|---|
| `ateli_caf_template_multitenant_luxo.html` | Ateliê Café — luxo escuro | Só paleta/layout de referência (HTML+JS vanilla, sem modelo de dados) |
| `gemini-code-1787034988017.html` | Aurea Joalheria — alta joalheria | Só referência visual |
| `gemini-code-1787035178439.html` | Vespera Studio — White & Navy | Só referência visual (tem `applyAccentColor()`, indício útil para `ThemeConfig.colors.primary`) |
| `gemini-code-1787035305228.html` | Vespera Studio — Pérola & Pastel | Variante de paleta do arquivo acima |
| `template_loja_perfumes.html` | L'Élite Perfumaria | Só referência visual, sem nenhuma interatividade JS |

Nenhum desses 5 exige retrabalho estrutural para entrar depois: o Theme Contract
define a fronteira pela interface (`ThemeConfig`/`ThemeModule`/`ThemeActions`), não
pela tecnologia de origem do protótipo. Cada um vira um "Tema 2, 3, 4..." futuro
apenas como referência de design — reconstruído como um novo `ThemeModule` em React,
nunca por importação direta do HTML/JS.

## 6. Política de testes

- Toda fase que toca dado multi-tenant só é considerada concluída com a bateria de
  isolamento (`SEED_DATA.md`, Tenant A/B) rodando e passando 100%.
- Webhooks (pagamento) devem ser idempotentes — reentrega do mesmo evento não
  duplica pedido nem pagamento.
- Nenhuma alteração em RLS policy é considerada segura sem um teste automatizado que
  tente o acesso cruzado entre tenants e confirme a negação.

## 7. Extensibilidade

Princípios preservados do `SPEC_MASTER` original: adicionar um novo tema, um novo
plano, um novo gateway de pagamento ou uma nova loja nunca deve exigir alteração
estrutural do Commerce Core. Isso já está refletido nas decisões acima —
`PaymentService` como adapter (ADR-0005), Theme Contract como interface (seção 5),
`Plan` como entidade de dados, não constante de código (ver `VISAO_E_MODELO_DE_NEGOCIO.md`
seção 4).
