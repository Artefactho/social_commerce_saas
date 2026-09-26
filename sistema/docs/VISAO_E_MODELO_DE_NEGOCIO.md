# Visão e Modelo de Negócio — SaaS Social Commerce

Este documento é a fonte de verdade sobre **o que é o produto e para quem ele existe**.
Decisões técnicas de como construir cada peça vivem em `ARQUITETURA_TECNICA.md`;
a ordem e os critérios de entrega vivem em `ROADMAP_DE_EXECUCAO.md`.

Este arquivo substitui, para fins de visão de produto, o `SPEC_MASTER___SaaS_Commerce_Multi-Tenant.md`
original (preservado como histórico em `/DOCUMENTACAO .MD`). O conteúdo abaixo foi
filtrado a partir dele: mantém a intenção de negócio estável e descarta ou reescreve
premissas que só faziam sentido para uma tentativa de implementação anterior (ver
seção 8).

---

## 1. O que é o produto

Uma plataforma SaaS multi-tenant que permite a qualquer lojista criar e administrar
sua própria loja digital — catálogo, vitrine pública, checkout e canal de vendas via
WhatsApp — sem precisar programar nada. A plataforma funciona como catálogo, vitrine,
link-in-bio comercial e ponto de venda para quem vende por redes sociais.

## 2. Modelo de negócio — quem paga o quê

```text
SaaS Commerce (esta plataforma)
 └── Cobra ASSINATURA do lojista (planos BÁSICO / PRO / MASTER)
 └── NÃO tem frete, produto físico ou estoque próprio
 └── Billing = Subscription + Plan

Loja do lojista (tenant)
 └── Vende produtos FÍSICOS e/ou DIGITAIS para os clientes finais dele
 └── Frete se aplica SOMENTE a produtos físicos, por loja
 └── Produtos digitais/infoprodutos nunca exigem frete
```

Regra permanente, a mais importante deste documento: **frete é uma regra do Commerce
Core, no nível loja/produto — nunca uma regra do faturamento do SaaS.** Confundir essas
duas camadas é o erro de modelo de negócio mais fácil de cometer e o mais caro de
corrigir depois (exigiria migração de dados de cobrança).

## 3. Hierarquia de dados

```text
User → Organization → N Stores → Products / Categories / Customers / Orders
```

Deliberadamente **não** se assume "1 usuário = 1 loja": uma organização pode ter várias
lojas desde o primeiro dia de desenho de dados, mesmo que o onboarding do MVP só crie
uma loja por vez. Essa é uma decisão de modelo de dados, não uma feature — não pode
ser adicionada depois sem migração.

## 4. Planos e limites

`Plan` é uma entidade configurável, não uma constante espalhada pelo código:

| Atributo | Descrição |
|---|---|
| `name` | BÁSICO / PRO / MASTER |
| `price` | valor da assinatura |
| `max_stores`, `max_products`, `max_users` | limites por organização |
| `available_themes` | quais temas o plano libera (ver `skills/theme-contract.md`) |
| `storage_limit` | limite de armazenamento de imagens |
| `features` | feature flags habilitadas (ex: WhatsApp, Pix, multi-loja) |

No MVP (ver corte na seção 7), esses limites podem ser checados por uma constante
simples de configuração — a entidade `Plan` e um painel para editá-la sem alterar
código é trabalho de fase 2+ (Billing, Roadmap Fase 6).

## 5. Fluxo de valor ponta a ponta

**Lojista:** cria conta → escolhe plano → cria organização → cria loja → escolhe
template/tema → personaliza (logo, cores, menus) → cadastra produtos → publica →
recebe pedidos → gerencia tudo pelo dashboard.

**Cliente final do lojista:** acessa a loja pública pelo slug (ou domínio customizado
depois) → navega pelo catálogo → adiciona ao carrinho → finaliza pedido (Pix ou outro
meio) → recebe confirmação, inclusive via WhatsApp se a loja usar esse canal.

**Admin do SaaS:** controla usuários, organizações, lojas e planos de toda a
plataforma, audita a operação — este papel é isolado dos papéis de dentro de uma
organização e é trabalho de fase 2+ (Roadmap Fase 7).

## 6. Escopo funcional por área

Cada área abaixo está marcada como **MVP** (entra na primeira versão que vai ao ar) ou
**Fase 2+** (evolução planejada, não bloqueia o primeiro lojista real). O corte
completo e o porquê de cada item estão na seção 7.

### 6.1 Site institucional e onboarding — MVP
Home institucional, página de planos, fluxo de autenticação completo
(cadastro→confirmação→login→onboarding), onboarding que coleta nome da loja, slug,
categoria, WhatsApp e tema inicial.

### 6.2 Painel do cliente (dashboard) — MVP
Área autenticada (`/dashboard` hoje, pode virar `/app`) com CRUD de loja, produtos,
categorias, clientes e pedidos, além de troca de tema/plano. Menu completo (Marketing,
Analytics avançado, Configurações avançadas) é Fase 2+.

### 6.3 Commerce Core — MVP (núcleo) / Fase 2+ (extensões)
**MVP:** produtos (com `product_type: physical|digital`), categorias, clientes,
pedidos, carrinho persistente, frete condicional por tipo de produto, checkout
desacoplado do tema, Pix real via um gateway (ver `ARQUITETURA_TECNICA.md`, ADR-0005),
WhatsApp.
**Fase 2+:** cupons/descontos avançados, múltiplos gateways de pagamento
plugáveis, cancelamento/reembolso automatizado.

### 6.4 Theme Engine e Store Configuration — MVP (fundação) / Fase 2+ (múltiplos temas)
A separação entre Commerce Core, Theme (camada visual) e Store Configuration
(personalização por loja: logo, cores, produtos, menus) é fundação obrigatória desde
o MVP — ver o contrato completo em `skills/theme-contract.md` e a justificativa arquitetural
em `ARQUITETURA_TECNICA.md`. O MVP entrega **um único tema oficial** (Aura Maison);
adicionar um segundo, terceiro tema é Fase 2+, mas não deve exigir nenhum retrabalho
estrutural quando chegar a hora — é só um novo pacote de tema respeitando o mesmo
contrato.

### 6.5 Painel administrativo do SaaS — Fase 2+
Painéis de usuários, organizações, lojas e planos de toda a plataforma, dashboard com
métricas globais, auditoria (`AuditLog`), LGPD (exportação/exclusão de dados por
titular). Não bloqueia o primeiro lojista vendendo — é operação de plataforma madura.

## 7. Corte de MVP — o que fica fora da primeira versão e por quê

O documento original (`SPEC_MASTER`) descreve uma plataforma SaaS madura e completa —
adequado como visão de produto de longo prazo, mas grande demais para guiar uma
primeira versão enxuta sem um corte explícito. Este é o corte adotado:

| Fica fora do MVP | Por quê |
|---|---|
| Theme Engine com múltiplos temas plugáveis via painel | Só existe 1 tema (Aura Maison) até haver demanda real por um segundo — mas a fundação (Theme Contract) já nasce pronta para isso, ver seção 6.4 |
| `PlanLimitService`/feature flags configuráveis via painel administrativo | Limites podem ser checados por configuração simples até existir mais de um plano ativo em produção |
| Painel administrativo completo do SaaS (usuários/organizações/lojas/planos, auditoria, LGPD) | Não bloqueia o primeiro lojista a vender; é operação de plataforma, não é o produto vendido |
| Cache com contexto de tenant, CDN, jobs assíncronos, observabilidade formal, rate limiting | Otimização prematura para poucas lojas; a arquitetura não pode impedir isso depois, mas não precisa existir no dia 1 |
| Múltiplos gateways de pagamento abstraídos | Um gateway real (Mercado Pago) resolve o MVP; a abstração (`PaymentService`) já existe desde o início para não travar a adição de um segundo gateway depois |
| Cupons avançados, cancelamento/reembolso automatizado | Regra de negócio real, mas não bloqueia a primeira venda |

O que **nunca** pode ser cortado, mesmo no MVP mais enxuto, porque re-adicionar depois
exigiria migração de dados ou retrabalho estrutural: isolamento multi-tenant completo
desde a primeira linha de código, hierarquia `Organization→Stores`, `product_type` e
frete condicional, e a separação Theme/Commerce Core/Store Configuration.

## 8. Nota sobre a origem deste documento

O `SPEC_MASTER` original continha instruções para "construir do zero, sem assumir
Lovable, código gerado por Lovable, Supabase ou qualquer arquitetura pré-existente" e
afirmava que "não existe projeto legado a preservar". Essas passagens foram escritas
antes de existir qualquer código real do projeto e **não refletem mais a situação
atual**: existe hoje um código funcional (avaliado e parcialmente reaproveitado,
ver `ARQUITETURA_TECNICA.md`) e uma implementação de referência do Theme Contract
(Aura Maison). Por isso essas passagens não foram migradas para os documentos novos —
foram conscientemente descartadas como desatualizadas, não por omissão.

Da mesma forma, o antigo `PROGRESS.md` descrevia "projeto ainda não iniciado", o que
também não é mais verdade — ver o `PROGRESS.md` atualizado com o estado real.
