# Roadmap de Execução — SaaS Social Commerce

Este documento define **a ordem de entrega** e o **critério de aceite testável** de
cada fase. O que construir está em `VISAO_E_MODELO_DE_NEGOCIO.md`; como construir está
em `ARQUITETURA_TECNICA.md`. Uma fase só é considerada `[OK]` em `PROGRESS.md` se
**todos** os itens do critério de aceite forem verdadeiros — não apenas "parece
funcionar".

O cenário de dados usado em todo teste de isolamento é o de `SEED_DATA.md`
(Tenant A / Tenant B). Sempre que possível, o critério de aceite abaixo é descrito
como um teste concreto usando esse cenário.

Numeração compatível com a já existente em `PROGRESS.md` e no `CLAUDE.md` operacional.

---

## Nota de processo — checagem Visão vs Roadmap (lição registrada)

Em 2026-09-13, um usuário testando o Dashboard perguntou como editar nome, logo e
cores da loja — funcionalidade que ele lembrava de ter visto prometida em algum lugar.
Investigação: `VISAO_E_MODELO_DE_NEGOCIO.md` já descrevia isso desde o início, tanto no
fluxo do lojista ("...escolhe template/tema → **personaliza (logo, cores, menus)** →
cadastra produtos...") quanto na seção 6.4 ("Store Configuration... é fundação
obrigatória desde o MVP"). Mas **este roadmap nunca transformou essa promessa em um
critério de aceite testável de nenhuma fase** — não é um item que foi cortado
deliberadamente (não está em nenhuma tabela de "fase 2+"), simplesmente nunca foi
escrito aqui. Resultado: a funcionalidade não existia no código, nem no Lovable
original nem depois da consolidação — só a promessa na visão e um ícone decorativo
num mockup de marketing (`DashboardMockup.tsx`) sugeriam que ela existiria.

**A lição, não só o item corrigido**: `VISAO_E_MODELO_DE_NEGOCIO.md` é a fonte de
verdade do *que* construir, mas só o que está escrito *aqui*, neste roadmap, com um
critério de aceite testável, realmente vira código verificado fase a fase. Sempre que
uma sessão futura for concluir uma fase inteira (gatilho de pausa do `CLAUDE.md` seção
6) ou revisar o roadmap por qualquer motivo, ela deve varrer a seção correspondente de
`VISAO_E_MODELO_DE_NEGOCIO.md` procurando promessas que ainda não têm um item
equivalente aqui — e adicionar o item (ou registrar explicitamente como "fase 2+", se
for uma decisão deliberada de corte) em vez de deixar a lacuna implícita. Uma promessa
da visão sem contrapartida no roadmap não é "ainda não priorizada" por padrão — é uma
lacuna de processo até alguém decidir explicitamente uma coisa ou outra.

**O item que faltava, agora adicionado**: ver Fase 4 abaixo, critério "UI de Store
Configuration (nome/logo/cores)". Implementado e validado em 2026-09-13 (`PROGRESS.md`
tem o detalhe técnico).

---

## Fase 0 — Arquitetura

**Escopo:** registrar os 6 ADRs em `adr/`, atualizar `CLAUDE.md` (seção Stack Atual) e
`PROGRESS.md` com o estado real do projeto.

**Ambiente:** —

**Critério de aceite:**
- [ ] Os 6 ADRs (`adr/0001-*.md` a `adr/0006-*.md`) estão com status `aceito`.
- [ ] `CLAUDE.md` seção "Stack Atual" preenchida, sem nenhum `[TBD]`.
- [ ] Estratégia de isolamento multi-tenant está explicitamente decidida e documentada
      (RLS nativo do Postgres, conforme ADR-0002).

## Fase 1 — Fundação

**Escopo:** squash das 28 migrations existentes numa baseline única e documentada;
criar `organizations`/`organization_members`; RBAC básico por loja; desenho do
Theme Contract + tabela de Store Configuration por tenant (mesmo que só o tema Aura
Maison exista ainda — ver `ARQUITETURA_TECNICA.md` seção 5).

**Ambiente:** local (Supabase CLI).

**Checkpoint de segurança obrigatório:** a baseline squashada é criada e validada
primeiro contra um Supabase local (`supabase start`) ou um projeto Supabase novo/
descartável. Só depois de os testes de isolamento abaixo passarem com sucesso nessa
baseline local é que se considera aplicá-la em qualquer projeto Supabase real — e
mesmo assim, com confirmação explícita antes.

**Critério de aceite:**
- [ ] `supabase db reset` aplica a baseline squashada sem erro.
- [ ] Cadastro, login, logout e recuperação de senha funcionam de ponta a ponta.
- [ ] Criar Tenant A e Tenant B (via seed) e confirmar que uma sessão logada como
      usuário de A não retorna nenhum dado de B em nenhuma rota testada.
- [ ] Tentar acessar uma rota protegida sem sessão válida → sempre nega.
- [ ] RBAC básico: um usuário `staff` não consegue executar uma ação restrita a
      `owner`/`admin`.
- [ ] Tabela de Store Configuration existe e uma loja consegue ter sua própria
      config (`ThemeConfig`) sem afetar outra loja.

## Fase 2 — Site

**Escopo:** home institucional, página de planos, telas de login/cadastro/
recuperação, onboarding completo ligado à nova hierarquia `Organization`.

**Ambiente:** local → preview.

**Critério de aceite:**
- [ ] Home, `/planos` e fluxo de cadastro→onboarding→primeira loja funcionam sem
      erros em mobile e desktop.
- [ ] Onboarding termina com uma `organization` e uma `store` criadas e visíveis no
      painel do cliente.

## Fase 3 — Commerce Core

**Escopo:** lojas (CRUD+slug), `categories` (nova), `products` com `product_type`,
`customers` (nova), carrinho, pedidos, cupons.

**Ambiente:** local → preview.

**Critério de aceite:**
- [ ] CRUD completo de loja, categoria e produto funcionando.
- [ ] Criar produto com `product_type = physical` e outro com `digital` na mesma
      loja — ambos coexistem corretamente.
- [ ] Frete some para produto digital e aparece para produto físico (regra #2 do
      `CLAUDE.md`).
- [ ] **Teste de isolamento (obrigatório):** usuário do Tenant A tenta acessar um
      produto, pedido, cliente ou categoria do Tenant B → resposta deve ser
      `403`/`404`, nunca `200`.
- [ ] Fluxo de carrinho: adicionar item, alterar quantidade, remover item, converter
      carrinho em pedido.
- [ ] Cupom aplicado apenas dentro da loja em que foi criado; um cupom da Loja A não
      é aceito na Loja B.

## Fase 4 — Theme Contract

**Escopo:** MVP usa 1 tema OFICIAL (Aura Maison, adaptado da implementação de
referência para consumir `ThemeRendererProps`/`ThemeActions` reais — ver
`ARQUITETURA_TECNICA.md` seção 5), mas a arquitetura de Theme Contract + Store
Configuration por tenant já nasce pronta para múltiplos temas. Nenhum retrabalho
estrutural deve ser necessário para adicionar o 2º tema depois.

**Ambiente:** local → preview.

**Critério de aceite:**
- [ ] Trocar o tema de uma loja (mesmo com só 1 tema disponível, o mecanismo de troca
      deve existir) não altera nenhuma regra de negócio — produto/pedido continuam
      funcionando igual.
- [ ] Configuração de tema inválida não derruba a loja (fallback gracioso, conforme
      `skills/theme-contract.md` seção 10).
- [ ] Aura Maison renderiza corretamente em mobile e desktop, consumindo dados reais
      do Commerce Core (não mais estado local/mockado).
- [ ] **UI de Store Configuration (nome/logo/cores)**: o lojista consegue editar o
      nome da loja, enviar um logo e escolher cor primária/cor de destaque pelo
      Dashboard (sem SQL) — mudança refletida de verdade na vitrine pública (não é só
      um formulário que salva e não aparece em lugar nenhum). Ver "Nota de processo"
      no topo deste documento: item que já estava prometido em
      `VISAO_E_MODELO_DE_NEGOCIO.md` seção 6.4 e nunca tinha sido formalizado aqui.
- [ ] **Evolução do escopo de temas (Checkpoint 96fdef9)**: O escopo original previa 1
      tema oficial (Aura Maison). O projeto evoluiu para registrar 5 temas oficiais
      (Base Theme, Minimal Clean, Aura Maison, Áurea Joalheria, Jô Perfumes) no
      `ThemeRegistry`, com injeção dinâmica de tokens CSS e customizador visual
      `VisualStoreEditor` com Live Preview.


## Fase 5 — Checkout

**Escopo:** checkout desacoplado do tema, frete condicional real, Pix via Mercado
Pago (ADR-0005), WhatsApp, cancelamento/reembolso básico.

**Ambiente:** preview AWS.

**Critério de aceite:**
- [ ] Loja só com produtos digitais → checkout nunca exibe etapa/campo de frete.
- [ ] Loja com produto físico → frete é calculado/exibido antes da finalização.
- [ ] Pedido misto (físico + digital) → frete calculado só sobre os itens físicos.
- [ ] Webhook de pagamento processado duas vezes (simular reentrega) não duplica o
      pedido nem o pagamento (idempotência).
- [ ] Cancelamento de pedido reflete no status sem duplicar valor ao reprocessar a
      mesma solicitação.

### Marco — primeiro deploy real

Frontend em **AWS Amplify Hosting**; backend em **Supabase Cloud tier FREE**
(upgrade para o tier Pro só na Fase 6, quando houver o primeiro cliente pagante real
em produção — ciente de que o projeto free pausa após 7 dias sem acesso, aceitável
nesta fase). Loja de teste acessível publicamente por slug, checkout funcional,
isolamento validado em produção.

## Fase 6 — Billing (mínimo viável)

**Escopo:** planos configuráveis, assinaturas do lojista, checagem de limite simples
por plano.

**Ambiente:** AWS.

**Critério de aceite:**
- [ ] Organização no plano BÁSICO não consegue criar loja/produto além do limite
      configurado.
- [ ] Tema exclusivo de um plano superior não aparece disponível para organização em
      plano inferior.
- [ ] **Upgrade do Supabase Cloud FREE para o tier Pro acontece aqui**, não antes.

## Fase 7 — Admin

**Escopo:** painel de usuários/organizações/lojas/planos do SaaS, auditoria, LGPD
básico.

**Ambiente:** AWS.

**Critério de aceite:**
- [ ] Admin consegue listar organizações, lojas e usuários de qualquer tenant — mas
      um `owner` de organização não consegue.
- [ ] Ação administrativa crítica (suspender organização, mudar plano) gera registro
      em `AuditLog`.
- [ ] Solicitação de exclusão de dados de um titular (LGPD) resulta em soft delete
      rastreável, não em erro nem exclusão silenciosa sem log.

## Fase 8 — Escala

**Escopo:** cache com contexto de tenant, storage com namespace por tenant, rate
limiting, observabilidade, **migração Supabase Cloud → self-host AWS** (EC2/ECS
Fargate + RDS, região `sa-east-1`, conforme ADR-0006).

**Ambiente:** AWS (self-host).

**Critério de aceite:**
- [ ] Nenhuma listagem carrega mais de N registros sem paginação.
- [ ] Dashboard não executa `SELECT *` seguido de cálculo no frontend — valores vêm
      agregados do backend.
- [ ] Suíte completa de testes de isolamento (produtos, pedidos, clientes,
      categorias, cache, storage) roda em CI e passa 100%.
- [ ] Migração para self-host AWS concluída sem reescrever nenhuma linha de
      aplicação (RLS, `auth.uid()` e buckets permanecem idênticos).
- [ ] Build de produção completa sem erros e sem warnings críticos.

---

## Regras que valem para todas as fases

1. Não avançar para a próxima fase sem validar o critério de aceite da fase atual.
2. Nenhuma alteração destrutiva (drop de tabela, rewrite de módulo inteiro) sem
   confirmação explícita.
3. Toda suposição de baixo impacto assumida durante uma fase deve ser documentada em
   `PROGRESS.md` (ver `CLAUDE.md` seção 5).
4. O teste de isolamento entre Tenant A e Tenant B (usando `SEED_DATA.md`) deve rodar
   em toda fase que toca dado multi-tenant, não só nas fases 1 e 3.
