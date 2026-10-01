# CONSTITUIÃ‡ÃƒO OPERACIONAL: SOCIAL COMMERCE SAAS

> **Framework MetodolÃ³gico:** Artefactho SDD Framework v1.0.0 (Tag 1.0.0, Commit 70caa06)  
> **Identificador no Ecossistema:** ATV-002  
> **RepositÃ³rio GitHub:** https://github.com/Artefactho/social_commerce_saas  
> **LocalizaÃ§Ã£o CanÃ´nica:** ARTEFACTHO â€” ECOSSISTEMA\13 â€” PROJETOS DE SOFTWARE\social_commerce_saas  

---

## 0. Ordem de Leitura ObrigatÃ³ria no InÃ­cio de Cada SessÃ£o
1. sistema/docs/CONSTITUTION.md (Este documento â€” regras inegociÃ¡veis e metodologia)
2. sistema/docs/PROGRESS.md (Estado real do projeto, histÃ³rico de fases e handoff)
3. sistema/docs/ROADMAP_DE_EXECUCAO.md (Fases de entrega e cronograma)
4. sistema/docs/ARQUITETURA_TECNICA.md (Stack, RLS, Edge Functions e Theme Engine)

---

## 1. ADN do Projeto
* **O que Ã©:** Plataforma SaaS Multi-Tenant de ComÃ©rcio Conversacional e Storefronts para PMEs e marcas D2C.
* **Stack Principal:** React 18 + Vite 5 + TypeScript + Tailwind + Supabase (PostgreSQL/RLS, Auth, Storage, Edge Functions).

---

## 2. Fluxo de Desenvolvimento SDD (9 Etapas)
1. EspecificaÃ§Ã£o Preliminar
2. AnÃ¡lise de Impacto (ADR)
3. AprovaÃ§Ã£o Humana se Gatilho de Pausa
4. Planejamento em Microetapas
5. ImplementaÃ§Ã£o Minimalista
6. Testes UnitÃ¡rios e de IntegraÃ§Ã£o
7. Auditoria Adversarial (sistema/docs/skills/auditoria-de-integracao-real.md)
8. Registro no sistema/docs/PROGRESS.md
9. Parada Limpa

---

## 3. Gatilhos ExplÃ­citos de Pausa para RevisÃ£o Humana
- ModificaÃ§Ãµes destrutivas em migrations do Supabase em produÃ§Ã£o;
- AdiÃ§Ã£o de novos provedores de pagamento PSP com transaÃ§Ãµes reais;
- AlteraÃ§Ã£o no modelo multi-tenant RLS que possa vazar dados entre lojas;
- Comandos com git reset --hard, git push --force ou deleÃ§Ã£o de arquivos histÃ³ricos.
