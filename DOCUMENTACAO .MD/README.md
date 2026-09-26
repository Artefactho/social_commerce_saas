# Registro de Decisões de Arquitetura (ADR)

Toda decisão técnica estrutural (framework, banco, estratégia de auth,
storage, gateway de pagamento, estratégia de multi-tenancy no banco, etc.)
deve virar um ADR **antes** de ser implementada, não depois.

## Regras

1. Numeração sequencial: `0001-titulo-curto.md`, `0002-...`.
2. Nunca apagar um ADR antigo. Se a decisão mudar, criar um novo ADR e marcar
   o antigo como `substituído por ADR-00XX`.
3. Use o `TEMPLATE.md` como base.
4. Depois de um ADR ser aceito, atualizar a seção 2 do `CLAUDE.md` (Stack Atual)
   se a decisão afetar comandos de build/test/lint.

## Decisões pendentes (a serem registradas na Fase de Arquitetura, §79 do SPEC_MASTER)

Estas ainda não têm ADR — devem ser decididas e registradas antes de
qualquer código ser escrito:

- [ ] **ADR-0001** — Stack geral (frontend, backend, linguagem)
- [ ] **ADR-0002** — Banco de dados e estratégia de isolamento multi-tenant
      (RLS nativo vs. filtro aplicado em camada própria vs. schema por tenant)
- [ ] **ADR-0003** — Autenticação (provider gerenciado vs. implementação própria)
- [ ] **ADR-0004** — Storage de arquivos/imagens
- [ ] **ADR-0005** — Abstração de pagamentos (PaymentService — Pix e futuros
      gateways, §18)
- [ ] **ADR-0006** — Estratégia de deploy/hospedagem

## Índice de ADRs aceitos

| ADR | Título | Status |
|---|---|---|
| — | (nenhum ainda) | — |
