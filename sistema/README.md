# SaaS Social Commerce

Esta é a **única pasta viva** do projeto a partir de agora — o que roda
localmente hoje e vai para AWS depois (ver `docs/adr/0006-deploy.md`). As
pastas antigas fora daqui (`../DOCUMENTACAO .MD`, `../SISTEMA SOCIAL COMMERCE`)
foram preservadas intactas como histórico e não devem mais ser editadas.

## Estrutura

```text
docs/          → documentação consolidada (comece por docs/CLAUDE.md)
frontend/      → app React (reaproveitado e limpo do código Lovable original)
backend/       → Edge Functions (Fase 5+)
supabase/      → schema, migrations (baseline squashada) e seed local
infra/         → deploy AWS (Amplify agora; self-host na Fase 8)
.github/       → CI
```

## Rodando local

```bash
# banco local (Docker necessário)
cd supabase
supabase start
supabase db reset   # aplica a baseline + seed.sql

# frontend
cd ../frontend
npm install
npm run dev
```

## Documentação — leia nesta ordem

1. `docs/CLAUDE.md` — como trabalhar no projeto, regras inegociáveis
2. `docs/VISAO_E_MODELO_DE_NEGOCIO.md` — o que é o produto
3. `docs/ARQUITETURA_TECNICA.md` — como é construído, isolamento multi-tenant
4. `docs/skills/theme-contract.md` — contrato do Theme Engine
5. `docs/ROADMAP_DE_EXECUCAO.md` — fases e critério de aceite
6. `docs/PROGRESS.md` — estado atual do projeto
