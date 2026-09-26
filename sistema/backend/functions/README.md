# Edge Functions (Supabase)

Vazio propositalmente por enquanto. Conforme ADR-0001 e ADR-0005
(`../../docs/adr/`), toda lógica que exige privilégio de servidor mora aqui
como Supabase Edge Functions (Deno/TS), não no frontend:

- `payments-webhook/` — recebe e valida a confirmação de pagamento do
  Mercado Pago (ADR-0005), atualiza `orders.status` de forma idempotente.
- `payments-create-charge/` — cria a cobrança Pix via Mercado Pago Connect.
- `admin-ops/` — operações administrativas cross-tenant (Fase 7 do
  `../../docs/ROADMAP_DE_EXECUCAO.md`), que não podem depender só de RLS.

Criadas na Fase 5 (checkout/pagamentos) e Fase 7 (admin) do roadmap — não
foram implementadas nesta rodada de consolidação, que cobriu documentação,
diagnóstico, arquitetura e limpeza do código existente.
