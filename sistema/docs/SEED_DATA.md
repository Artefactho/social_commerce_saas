# SEED_DATA.md — Cenário Padrão de Dados para Testes

Este documento define **o que** deve existir no ambiente de teste, não **como**
implementar (isso é um seed script SQL, aplicado via Supabase CLI local, conforme
ADR-0001/ADR-0002). O objetivo é sempre o mesmo cenário mínimo, usado em todo teste
de isolamento e em todo teste funcional de fluxo, para que os resultados sejam
comparáveis entre sessões e entre fases.

Adaptado ao schema real decidido em `ARQUITETURA_TECNICA.md` seção 4 — inclui
`organizations` (nova), `categories` estruturadas (nova), `customers` (nova) e
`product_type` (novo), que não existiam no schema herdado do código Lovable.

---

## Por que só 2 tenants já são suficientes

O teste que mais importa é: **Tenant A nunca acessa dado de Tenant B.** Para provar
isso, o mínimo necessário é ter exatamente dois tenants com dados equivalentes — se o
isolamento falhar em qualquer ponto, ele aparece imediatamente ao tentar cruzar A com
B.

## Estrutura do cenário

```text
Organização A — "Aura Maison Teste" (organizations)
├── Usuário: owner.a@teste.com (organization_members.role: owner)
├── Usuário: staff.a@teste.com (organization_members.role: staff)
├── Plano: PRO
├── Loja: "Loja A" (stores.slug: loja-a, organization_id: Organização A)
│    ├── Categoria: "Perfumes" (categories)
│    ├── Produto físico: "Perfume X" (products.product_type: physical, stock: 10)
│    ├── Produto digital: "E-book de Cuidados" (products.product_type: digital)
│    ├── Cupom: "BEMVINDA10" (10%, válido, store_id: Loja A)
│    ├── Cliente: cliente.a@teste.com (customers, store_id: Loja A)
│    ├── Carrinho aberto com 1 item físico + 1 digital
│    ├── Store Configuration: ThemeConfig da Loja A (tema Aura Maison)
│    └── Pedido concluído (status: paid) com 1 item físico

Organização B — "Loja Genérica Teste" (organizations)
├── Usuário: owner.b@teste.com (organization_members.role: owner)
├── Plano: BÁSICO
├── Loja: "Loja B" (stores.slug: loja-b, organization_id: Organização B)
│    ├── Categoria: "Roupas" (categories)
│    ├── Produto físico: "Camiseta Y" (products.product_type: physical, stock: 5)
│    ├── Cupom: "PROMOB" (válido, store_id: Loja B)
│    ├── Cliente: cliente.b@teste.com (customers, store_id: Loja B)
│    ├── Store Configuration: ThemeConfig da Loja B (tema Aura Maison, cores
│    │    diferentes — prova que Store Configuration é por tenant, não por tema)
│    └── Pedido pendente (status: pending)
```

## Bateria mínima de testes de isolamento a rodar com esse cenário

Logado como `owner.a@teste.com`, tentar (todas devem falhar com `403`/`404`, nunca
`200`):

- [ ] `GET` no produto físico da Loja B
- [ ] `GET` no pedido da Organização B
- [ ] `GET` no cliente da Loja B
- [ ] `GET` na categoria "Roupas" da Loja B
- [ ] Aplicar o cupom `PROMOB` (da Loja B) no carrinho da Loja A
- [ ] Listar categorias sem filtro explícito e confirmar que só vêm as da Organização
      A
- [ ] Tentar excluir/editar o produto da Loja B usando o ID direto na URL (teste de
      IDOR)
- [ ] Ler/editar a `Store Configuration` (ThemeConfig) da Loja B

Logado como `staff.a@teste.com` (RBAC por loja, novo — não existia no schema
herdado):
- [ ] Tentar executar uma ação restrita a `owner` (ex: mudar plano da organização,
      excluir a loja) → deve negar.

E, do lado admin (usuário com role administrativa do SaaS):
- [ ] Confirmar que o admin **consegue** ver ambas as organizações — isso é esperado,
      mas só para quem tem role administrativa, nunca para `owner.a`/`owner.b`.

## Regras sobre este cenário

1. Nunca usar dados reais de clientes — sempre e-mails `@teste.com` e dados
   fictícios.
2. Este cenário deve poder ser recriado do zero a qualquer momento (script
   idempotente: rodar duas vezes não deve duplicar os dados nem quebrar).
3. Ao adicionar uma entidade nova ao produto (ex: avaliação de produto, se um dia
   existir), adicionar também ao cenário aqui — este documento deve crescer junto
   com o modelo de dados descrito em `ARQUITETURA_TECNICA.md`.
4. Este cenário roda em ambiente de desenvolvimento/teste apenas — nunca em produção,
   e nunca contra o projeto Supabase real sem ser explicitamente um projeto de
   teste/descartável (ver checkpoint de segurança da Fase 1 em
   `ROADMAP_DE_EXECUCAO.md`).
