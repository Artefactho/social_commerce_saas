# ADR-0002: Banco de dados e isolamento multi-tenant

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

Regra mais inegociável do projeto ("teste mais importante"): Tenant A nunca acessa
dado de Tenant B. Precisa suportar "milhares de lojas" com baixo custo de manutenção.
O schema atual (28 migrations no código Lovable) já usa RLS nativo do Postgres, mas
sem uma camada de `Organization` — `stores.owner_id` aponta direto para `auth.users`.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **A. RLS nativo do Postgres (atual)** | Já implementado e testado; escala para milhares de lojas trivialmente (linhas com `store_id`/`organization_id` indexado, não schemas nem bancos separados); enforcement no banco, não no app; portável entre Supabase e RDS | Policies complexas em joins profundos exigem disciplina e testes de isolamento automatizados; erro de policy é silencioso até o teste específico pegar |
| **B. Filtro em camada de aplicação (`WHERE store_id = ?` em todo repositório)** | Modelo mental simples | Um único endpoint esquecido = vazamento entre tenants — exatamente o que a regra #1 do `CLAUDE.md` proíbe; nenhuma defesa em profundidade |
| **C. Schema-per-tenant (um schema Postgres por loja)** | Isolamento físico mais forte | Inviável para milhares de lojas: quebra connection pooling (PgBouncer/Supavisor), migrations precisam rodar N vezes, provisionar loja nova vira operação pesada |

## Decisão

Manter **RLS nativo do Postgres** como mecanismo primário de isolamento, com
**defesa em profundidade** nas Edge Functions (revalidar `store_id`/`organization_id`
do contexto autenticado antes de qualquer escrita privilegiada, nunca confiar em
`store_id` vindo do payload do cliente). Ação concreta: fazer squash das 28 migrations
existentes numa baseline única e documentada, adicionando `organizations` e
`organization_members`, e revisar cada policy para cobrir o novo nível hierárquico
(`organization_id` em `stores`; policies de `products`/`orders` continuam via
`store_id`, mas o acesso a `stores` passa a verificar membership da organização, não
só `owner_id`).

## Consequências

Zero custo adicional (mesma engine já usada). Exige criar uma suíte de testes de
isolamento (Tenant A nunca vê dado de Tenant B) antes de considerar qualquer fase
concluída — formalizada já na Fase 1 do roadmap, não só na Fase 8. O squash das 28
migrations (~15 delas são histórico de tentativa-e-erro em RLS de `orders`/
`order_items`) deve ser validado localmente (`supabase start` ou projeto Supabase
descartável) antes de aplicar em qualquer projeto real — nunca direto no projeto
Supabase existente.

## Relacionado

- `ARQUITETURA_TECNICA.md` seções 3 e 4
- `SEED_DATA.md` (cenário Tenant A/B)
- `ROADMAP_DE_EXECUCAO.md` Fase 1
- ADR-0001 (stack geral)
