# SEED_DATA.md — Cenário Padrão de Dados para Testes

Este documento define **o que** deve existir no ambiente de teste, não
**como** implementar (isso depende da stack escolhida no ADR-0001/0002).
Uma vez que a stack for definida, o Claude Code implementa este cenário
como seed script (SQL, fixture, factory — o que for idiomático na stack).

O objetivo é sempre o mesmo cenário mínimo, usado em todo teste de
isolamento e em todo teste funcional de fluxo, para que os resultados sejam
comparáveis entre sessões e entre fases.

---

## Por que só 2 tenants já são suficientes

O teste que mais importa (§71 do SPEC_MASTER) é: **Tenant A nunca acessa
dado de Tenant B.** Para provar isso, o mínimo necessário é ter exatamente
dois tenants com dados equivalentes — se o isolamento falhar em qualquer
ponto, ele aparece imediatamente ao tentar cruzar A com B.

## Estrutura do cenário

```text
Organização A — "Aura Maison Teste"
├── Usuário: owner.a@teste.com (role: owner)
├── Usuário: staff.a@teste.com (role: staff)
├── Plano: PRO
├── Loja: "Loja A" (slug: loja-a)
│    ├── Categoria: "Perfumes"
│    ├── Produto físico: "Perfume X" (product_type: physical, stock: 10)
│    ├── Produto digital: "E-book de Cuidados" (product_type: digital)
│    ├── Cupom: "BEMVINDA10" (10%, válido)
│    ├── Cliente: cliente.a@teste.com
│    ├── Carrinho aberto com 1 item físico + 1 digital
│    └── Pedido concluído (status: paid) com 1 item físico

Organização B — "Loja Genérica Teste"
├── Usuário: owner.b@teste.com (role: owner)
├── Plano: BÁSICO
├── Loja: "Loja B" (slug: loja-b)
│    ├── Categoria: "Roupas"
│    ├── Produto físico: "Camiseta Y" (product_type: physical, stock: 5)
│    ├── Cupom: "PROMOB" (válido)
│    ├── Cliente: cliente.b@teste.com
│    └── Pedido pendente (status: pending)
```

## Bateria mínima de testes de isolamento a rodar com esse cenário

Logado como `owner.a@teste.com`, tentar (todas devem falhar com
`403`/`404`, nunca `200`):

- [ ] `GET` no produto físico da Loja B
- [ ] `GET` no pedido da Organização B
- [ ] `GET` no cliente da Loja B
- [ ] Aplicar o cupom `PROMOB` (da Loja B) no carrinho da Loja A
- [ ] Listar categorias sem filtro explícito e confirmar que só vêm as da
      Organização A
- [ ] Tentar excluir/editar o produto da Loja B usando o ID direto na URL
      (teste de IDOR, §72)

E, do lado admin (usuário com role administrativa do SaaS):

- [ ] Confirmar que o admin **consegue** ver ambas as organizações — isso é
      esperado (§93), mas só para quem tem role administrativa, nunca para
      `owner.a`/`owner.b`.

## Regras sobre este cenário

1. Nunca usar dados reais de clientes — sempre e-mails `@teste.com` e dados
   fictícios.
2. Este cenário deve poder ser recriado do zero a qualquer momento (script
   idempotente: rodar duas vezes não deve duplicar os dados nem quebrar).
3. Ao adicionar uma entidade nova ao produto (ex: avaliação de produto,
   se um dia existir), adicionar também ao cenário aqui — este documento
   deve crescer junto com o modelo de dados do SPEC_MASTER.
4. Este cenário roda em ambiente de desenvolvimento/teste apenas — nunca em
   produção.
