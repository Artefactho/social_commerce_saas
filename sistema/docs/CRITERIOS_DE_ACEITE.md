# CRITÉRIOS DE ACEITE — Detalhamento Complementar

O critério de aceite testável de cada fase vive em `ROADMAP_DE_EXECUCAO.md` (fonte
principal). Este arquivo complementa com detalhamento adicional que se aplica de
forma transversal, através de múltiplas fases — para não repetir o mesmo texto em
cada seção do roadmap.

Uma fase só é considerada `[OK]` em `PROGRESS.md` se **todos** os itens do critério
de aceite da fase (`ROADMAP_DE_EXECUCAO.md`) forem verdadeiros — não apenas "parece
funcionar".

---

## Bateria de isolamento — como testar, em qualquer fase que toque dado multi-tenant

Usando o cenário padrão de `SEED_DATA.md` (Tenant A / Tenant B), logado como
`owner.a@teste.com`, as ações abaixo devem **sempre** falhar com `403`/`404`, nunca
`200`:

- `GET` em qualquer produto/pedido/cliente/categoria da Loja B, mesmo sabendo o ID.
- Aplicar um cupom da Loja B no carrinho da Loja A.
- Listar qualquer coleção sem filtro explícito e receber algo que não seja só da
  Organização A.
- Editar/excluir um recurso da Loja B usando o ID direto na URL ou no payload (teste
  de IDOR).

Do lado admin (role administrativa do SaaS): confirmar que o admin **consegue** ver
ambas as organizações — isso é esperado — mas só para quem tem role administrativa,
nunca para `owner.a`/`owner.b`.

## Idempotência — webhooks e ações financeiras

Qualquer webhook (confirmação de pagamento Pix) processado duas vezes (simular
reentrega) não deve duplicar o pedido nem o pagamento. Qualquer ação de cancelamento/
reembolso reprocessada não deve duplicar o valor estornado.

## LGPD

Solicitação de exclusão de dados de um titular deve resultar em soft delete
rastreável (nunca exclusão física silenciosa, nunca erro). Nenhum dado pessoal deve
aparecer em log, export ou analytics além do estritamente necessário.

## Performance — quando aplicável (a partir da Fase 8, mas vale como princípio desde antes)

Nenhuma listagem carrega mais de N registros sem paginação. Dashboard não executa
`SELECT *` seguido de cálculo agregado no frontend — valores agregados vêm do
backend.

## Regra de conclusão de fase

Ao final de cada fase, apresentar o diagnóstico usando a mesma classificação para
evitar ilusão de progresso:

- **[OK]** — critério de aceite 100% cumprido, testado.
- **[PARTIAL]** — parte do critério cumprida; listar exatamente o que falta.
- **[MISSING]** — item do escopo da fase não implementado.
- **[PROBLEM]** — implementado, mas com bug/risco conhecido que precisa de decisão
  antes de prosseguir.

Nunca marcar uma fase como `[OK]` só porque "compila" ou "parece funcionar na tela" —
o critério de `ROADMAP_DE_EXECUCAO.md` tem que ter sido testado de fato, incluindo a
bateria de isolamento quando aplicável.
