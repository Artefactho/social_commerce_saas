# Registro de Decisões de Arquitetura (ADR)

Toda decisão técnica estrutural (framework, banco, estratégia de auth, storage,
gateway de pagamento, estratégia de multi-tenancy no banco, deploy, etc.) vira um ADR
**antes** de ser implementada, não depois.

## Regras

1. Numeração sequencial: `0001-titulo-curto.md`, `0002-...`.
2. Nunca apagar um ADR antigo. Se a decisão mudar, criar um novo ADR e marcar o
   antigo como `substituído por ADR-00XX`.
3. Use o `TEMPLATE.md` como base.
4. Depois de um ADR ser aceito, atualizar a seção 2 do `CLAUDE.md` (Stack Atual) se a
   decisão afetar comandos de build/test/lint.

## Índice de ADRs aceitos

| ADR | Título | Status |
|---|---|---|
| [0001](0001-stack-geral.md) | Stack geral (frontend/backend) | aceito |
| [0002](0002-multi-tenancy.md) | Banco de dados e isolamento multi-tenant | aceito |
| [0003](0003-autenticacao.md) | Autenticação | aceito |
| [0004](0004-storage.md) | Storage de arquivos/imagens | aceito |
| [0005](0005-pagamentos.md) | Abstração de pagamentos (PaymentService, Pix) | aceito |
| [0006](0006-deploy.md) | Estratégia de deploy/hospedagem (AWS vs VPS) | aceito |

Todos os 6 ADRs pendentes herdados do documento original foram decididos e
registrados nesta rodada — ver cada arquivo para contexto completo, opções
comparadas e consequências. Resumo executivo das 6 decisões em
`ARQUITETURA_TECNICA.md` seção 2.
