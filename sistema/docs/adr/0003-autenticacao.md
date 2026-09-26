# ADR-0003: Autenticação

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

Supabase Auth (GoTrue) já está implementado e funcional no código Lovable avaliado:
signup/login, `ProtectedRoute`, e todas as RLS policies existentes usam `auth.uid()`.
Trocar de provedor implicaria reescrever toda policy que referencia `auth.uid()`.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **A. Supabase Auth (GoTrue) — manter** | Já funciona; `auth.uid()` já é a base de toda RLS existente; suporta e-mail/senha, magic link, OAuth social se precisar depois; pode ser self-hosted em AWS depois (não é lock-in em "Supabase Cloud" especificamente) | Menos "AWS nativo" enquanto não self-hostado |
| **B. AWS Cognito** | Serviço AWS nativo, tier gratuito generoso (50k MAU) | Não gera `auth.uid()` compatível com RLS automaticamente — exige mapear claims customizados nas policies; DX reconhecidamente mais pobre (reset de senha, e-mail, MFA exigem mais código); reescreveria `Auth.tsx`, `ProtectedRoute.tsx` e todas as policies sem ganho funcional correspondente |
| **C. Auth própria (tabela `users` + JWT custom)** | Controle total | Reinventa reset de senha, verificação de e-mail, sessão, MFA — semanas de trabalho e superfície de risco maior para um requisito já resolvido |

## Decisão

Manter **Supabase Auth**. O custo de migrar algo que já funciona é alto (reescrever
autenticação + todas as RLS policies) e o benefício é baixo — Cognito não é
pré-requisito para "estar na AWS" (o restante da stack pode estar em AWS enquanto Auth
continua sendo o GoTrue do Supabase, Cloud ou self-hosted). Trabalho novo necessário
independente do provedor: RBAC por loja (`organization_members.role`), hoje
inexistente (hoje `user_roles` é global).

## Consequências

Nenhum retrabalho de autenticação no MVP. RBAC por loja precisa ser desenhado como
trabalho novo na Fase 1, não como migração do que já existe. Se um dia a operação
exigir Cognito por motivo de compliance corporativo específico, isso vira um novo ADR
substituindo este — não uma alteração silenciosa.

## Relacionado

- `ARQUITETURA_TECNICA.md` seções 3 e 4
- ADR-0002 (multi-tenancy/RBAC), ADR-0006 (deploy)
