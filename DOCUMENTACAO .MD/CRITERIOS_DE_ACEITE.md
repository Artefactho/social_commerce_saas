# CRITÉRIOS DE ACEITE POR FASE

Este arquivo detalha, de forma testável, o critério genérico da seção 82 do
SPEC_MASTER ("build funcionando, testes passando, isolamento validado").
Uma fase só é considerada `[OK]` em `PROGRESS.md` se **todos** os itens
abaixo forem verdadeiros — não apenas "parece funcionar".

Sempre que possível, o critério é descrito como um teste concreto usando o
cenário padrão do `SEED_DATA.md` (Tenant A / Tenant B).

---

## Fase 0 — Arquitetura

- [ ] Todos os ADRs pendentes (ver `/adr/README.md`) estão com status `aceito`.
- [ ] `CLAUDE.md` seção 2 (Stack Atual) preenchida, sem nenhum `[TBD]`.
- [ ] Estratégia de isolamento multi-tenant no banco está explicitamente
      decidida e documentada (RLS, filtro em camada, ou schema por tenant).

## Fase 1 — Fundação

- [ ] Cadastro, login, logout e recuperação de senha funcionam de ponta a ponta.
- [ ] Criar Tenant A e Tenant B (via seed) e confirmar que uma sessão logada
      como usuário de A não retorna nenhum dado de B em nenhuma rota testada.
- [ ] Tentar acessar uma rota protegida sem sessão válida → sempre nega.
- [ ] RBAC básico: um usuário `staff` não consegue executar uma ação restrita
      a `owner`/`admin`.

## Fase 2 — Site

- [ ] Home, `/planos` e fluxo de cadastro→onboarding→primeira loja funcionam
      sem erros em mobile e desktop.
- [ ] Onboarding termina com uma loja criada e visível no painel do cliente.

## Fase 3 — Core Commerce

- [ ] CRUD completo de loja, categoria e produto funcionando.
- [ ] Criar produto com `product_type = physical` e outro com `digital` na
      mesma loja — ambos coexistem corretamente.
- [ ] **Teste de isolamento (obrigatório):** usuário do Tenant A tenta acessar
      `GET /products/:id` de um produto do Tenant B → resposta deve ser
      `403`/`404`, nunca `200`. Repetir para pedidos, clientes e categorias.
- [ ] Fluxo de carrinho: adicionar item, alterar quantidade, remover item,
      converter carrinho em pedido.
- [ ] Cupom aplicado apenas dentro da loja em que foi criado; testar que um
      cupom da Loja A não é aceito na Loja B.

## Fase 4 — Theme Engine

- [ ] Trocar o tema de uma loja sem alterar nenhuma regra de negócio
      (produto/pedido continuam funcionando igual).
- [ ] Configuração de tema inválida não derruba a loja (fallback seguro).
- [ ] Aura Maison renderiza corretamente em mobile e desktop.

## Fase 5 — Checkout

- [ ] Loja só com produtos digitais → checkout nunca exibe etapa/campo de
      frete.
- [ ] Loja com produto físico → frete é calculado/exibido antes da
      finalização.
- [ ] Pedido misto (físico + digital) → frete calculado só sobre os itens
      físicos.
- [ ] Webhook de pagamento processado duas vezes (simular reentrega) não
      duplica o pedido nem o pagamento (idempotência, §67).
- [ ] Cancelamento de pedido reflete no status e, se aplicável, aciona
      reembolso sem duplicar valor ao reprocessar a mesma solicitação.

## Fase 6 — Billing

- [ ] Organização no plano BÁSICO não consegue criar loja/produto além do
      limite configurado (`PlanLimitService`).
- [ ] Trocar o limite de um plano via configuração reflete sem precisar
      alterar código.
- [ ] Tema exclusivo de um plano superior não aparece disponível para
      organização em plano inferior.

## Fase 7 — Admin

- [ ] Admin consegue listar organizações, lojas e usuários de qualquer
      tenant — mas um `owner` de organização não consegue.
- [ ] Ação administrativa crítica (suspender organização, mudar plano) gera
      registro em `AuditLog`.
- [ ] Solicitação de exclusão de dados de um titular (LGPD, §38.1) resulta em
      soft delete rastreável, não em erro nem exclusão silenciosa sem log.

## Fase 8 — Escala

- [ ] Nenhuma listagem carrega mais de N registros sem paginação (definir N
      no ADR de performance, se houver).
- [ ] Dashboard não executa `SELECT *` seguido de cálculo no frontend —
      valores vêm agregados do backend.
- [ ] Suite completa de testes de isolamento (produtos, pedidos, clientes,
      categorias, cache, storage) roda em CI e passa 100%.
- [ ] Build de produção completa sem erros e sem warnings críticos.
