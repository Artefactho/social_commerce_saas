# ADR-0005: Abstração de pagamentos (PaymentService, Pix)

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

O checkout hoje só simula pagamento (PIX/cartão são apenas rádios de UI, sem gateway
real). Ponto de negócio crítico: o dinheiro da venda é do lojista, não do SaaS — o
SaaS cobra assinatura à parte (`VISAO_E_MODELO_DE_NEGOCIO.md` seção 2). Logo, o Pix da
venda deve cair na conta do lojista, não transitar pela conta do SaaS.

## Opções consideradas

| Opção de gateway | Prós | Contras |
|---|---|---|
| **Mercado Pago (Connect/split + Pix API)** | Maior adoção no Brasil, documentação madura; suporta modelo "marketplace"/Connect (OAuth) onde o dinheiro cai na conta do próprio lojista; taxa Pix baixa (~0,99%) paga pelo lojista | Onboarding do lojista exige conectar conta Mercado Pago via OAuth (fricção extra) |
| **Asaas** | Conta/subconta gerenciável, foco em PMEs brasileiras, split nativo | Menos difundido que Mercado Pago, taxas um pouco mais altas em alguns planos |
| **Efí (ex-Gerencianet)** | Pix direto muito simples de integrar | Split multi-conta (marketplace) menos maduro |
| **Pagar.me (Stone)** | Robusto para split e recebíveis | Mais peso/complexidade do que o MVP precisa |

## Decisão

Desenhar `PaymentService` como **interface/adapter** (`PaymentGateway`:
`createCharge`, `handleWebhook`, `getStatus`) desde o início, e implementar o
**primeiro adapter com Mercado Pago** (Checkout Transparente/Pix API + Mercado Pago
Connect/OAuth), para que o Pix da venda caia na conta do próprio lojista, não na conta
do SaaS. Webhook de confirmação processado por uma **Supabase Edge Function**
dedicada (valida assinatura, atualiza `orders.status`, nunca confia em callback do
frontend).

## Consequências

Custo de transação (~0,99%–4,99% conforme meio de pagamento) é pago pelo lojista
dentro da própria conta Mercado Pago dele — custo zero direto para a operação do
SaaS, só custo de desenvolvimento da integração. Segundo adapter (Asaas ou Efí) fica
documentado como extensão futura, sem bloquear o MVP, desde que a interface
`PaymentGateway` seja respeitada desde o primeiro adapter.

## Relacionado

- `ARQUITETURA_TECNICA.md` seção 2 (ADR-0005), `VISAO_E_MODELO_DE_NEGOCIO.md` seção 2
- `ROADMAP_DE_EXECUCAO.md` Fase 5
