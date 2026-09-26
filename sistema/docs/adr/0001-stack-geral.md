# ADR-0001: Stack geral (frontend/backend)

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

Hoje não existe backend próprio: o código Lovable avaliado
(`SISTEMA SOCIAL COMMERCE/grace-and-grove-main`) fala direto com Supabase via
`supabase.from()` no frontend. A regra de isolamento multi-tenant exige que o
isolamento seja garantido sempre no backend/banco, nunca confiando em filtro do
frontend. O dono do produto pede que toda decisão pese custo, velocidade de
desenvolvimento e facilidade de rodar local primeiro, migrar pra nuvem depois — sem
escolher tecnologia por familiaridade.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **A. Frontend React+Vite+TS (mantido) + Supabase como backend (Postgres+RLS+PostgREST) + Edge Functions para lógica privilegiada** | Reaproveita 100% do frontend validado (auth, onboarding, dashboard, vitrine, checkout-UI); RLS no Postgres já satisfaz "isolamento sempre no banco" sem precisar de uma API própria; Edge Functions cobrem o que RLS não cobre (webhook Pix, operações admin cross-tenant); velocidade de desenvolvimento altíssima; custo mínimo | Lógica de negócio fica dividida entre RLS/policies e Edge Functions — exige disciplina de documentação |
| **B. API própria em Node/NestJS (ou Fastify) em ECS Fargate, Postgres RDS puro** | Máximo controle, um único lugar para regra de negócio | Reescreve auth, storage e todas as queries do zero; RLS ainda seria necessário no RDS, então não elimina a complexidade do ADR-0002, só adiciona uma camada; semanas a mais antes do primeiro MVP; custo de infra maior desde o dia 1 |
| **C. Next.js/Remix full-stack (SSR) substituindo Vite** | SEO nativo para vitrine pública | Descarta injustificadamente um frontend Vite já funcional e testado (e o código real é Vite puro, não Remix); migração de framework por um ganho de fase 2+ (SEO) |

## Decisão

Opção A. Manter **React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + Zustand
(carrinho/wishlist) + TanStack Query** no frontend (passando a usar TanStack Query de
verdade, encapsulando `supabase.from()` em hooks). Backend = **Supabase (Postgres +
RLS + PostgREST + GoTrue + Storage + Realtime) + Supabase Edge Functions (Deno/TS)**
para tudo que exige privilégio de servidor: webhook de Pix, `PaymentService`,
operações de admin cross-tenant, validações de negócio que não cabem em RLS
declarativa.

## Consequências

Acelera drasticamente o MVP e reaproveita o código Lovable existente. Exige
documentar bem onde cada regra de negócio mora (RLS vs Edge Function) para não
repetir a dívida técnica de tentativa-e-erro já observada nas migrations atuais. Não
fecha a porta para uma API própria depois — o Postgres com RLS é portável para RDS
sem reescrever a lógica de isolamento (ver ADR-0002). Reavaliar migração para um
serviço Node/Fastify dedicado só na Fase 8 (Escala), se consultas complexas
ultrapassarem o que PostgREST+RLS+Edge Functions resolvem confortavelmente.

## Relacionado

- `ARQUITETURA_TECNICA.md` seções 1 e 2
- ADR-0002 (multi-tenancy), ADR-0006 (deploy)
