# ADR-0006: Estratégia de deploy/hospedagem (AWS vs VPS)

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

Preferência confirmada do dono do produto: destino final é **AWS**. Pedido explícito
de comparação honesta com VPS para o estágio de MVP, e decisão sobre self-host
Supabase vs Supabase Cloud vs serviços AWS nativos. Fator concreto: nem Hetzner nem
DigitalOcean (VPS mais citadas como "baratas") têm datacenter no Brasil; a AWS tem a
região `sa-east-1` (São Paulo), relevante para latência de checkout de um comércio
brasileiro.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **A. VPS (Hetzner/DigitalOcean) self-host Supabase via docker-compose** | Mais barato nominalmente no MVP (~$45-70/mês); paridade com dev local | Sem datacenter no Brasil (latência pior); toda responsabilidade de patch/segurança/backup é do dono; é um destino que o próprio dono já disse que não quer manter — migração futura garantida (custo de engenharia duplicado) |
| **B. AWS via Supabase Cloud (backend gerenciado) + frontend em AWS Amplify Hosting** | Custo comparável ou menor que VPS no MVP (~$25-40/mês); zero ops de banco/auth/storage; Supabase CLI roda localmente os mesmos containers que a Cloud roda; frontend fica formalmente "na AWS" desde o dia 1 | Não é "AWS" para banco/auth enquanto não migrar para self-host; menos controle de rede até a migração |
| **C. AWS self-hosted Supabase (EC2/ECS + RDS + S3) desde o início** | Já 100% "AWS" desde o início | Assume operação (patch, backup, monitoramento) mais cedo do que necessário; NAT Gateway (~$33/mês) e ALB (~$20-30/mês) são custos escondidos comuns |
| **D. AWS 100% nativo (RDS + Cognito + ECS Fargate + ALB + Amplify)** | Mais "enterprise" | Maior custo de dia 1 (~$70-90/mês) e maior custo de retrabalho (troca de Auth, ver ADR-0003) sem ganho correspondente no MVP |

**Estimativas de custo mensal aproximado (USD):**

| Estágio | VPS self-host | AWS via Supabase Cloud + Amplify | AWS self-hosted | AWS 100% nativo |
|---|---|---|---|---|
| MVP (poucas lojas) | ~$45-70 | ~$25-40 | ~$45-65 | ~$70-90 |
| Crescimento | ~$150-250 + DevOps manual | ~$120-200 | ~$180-280 | ~$250-400 |
| Escala (milhares de lojas) | ~$400-700 + equipe dedicada | ~$599+ | ~$700-1.200 | ~$800-1.500 |

## Decisão

**AWS, não VPS**, desde o início — em duas sub-fases, sem ambiguidade de escopo:

1. **MVP (Fases 0-5 do roadmap):** Opção B — **AWS Amplify Hosting (frontend) +
   Supabase Cloud tier FREE (backend gerenciado)**. Explicitamente **não** um backend
   nativo AWS nesta fase (nada de EC2/ECS/RDS/Cognito ainda) — trade-off deliberado de
   velocidade/custo, documentado, não uma decisão em aberto. Upgrade do Supabase Cloud
   FREE para o tier Pro (~$25/mês) só na Fase 6, quando houver o primeiro cliente
   pagante real em produção.
2. **Crescimento/Escala (Fase 8 em diante):** migrar o backend para **self-host
   Supabase em AWS** (EC2 ou ECS Fargate rodando GoTrue/PostgREST/Storage-API/
   Realtime, região `sa-east-1`, RDS Postgres conforme necessidade de HA) — sem
   reescrever nenhuma linha de aplicação, porque o modelo (RLS, `auth.uid()`, buckets)
   é idêntico.

A diferença de custo entre VPS e a Opção B no MVP é pequena (~$10-30/mês) — pequena
demais para justificar um destino que o dono já disse que não quer manter. Começar em
VPS garantiria uma migração futura certa, só para economizar algo que a AWS via
Supabase Cloud já entrega por valor parecido, com região no Brasil disponível quando
migrar para self-host.

## Consequências

Exige, na Fase 8, uma migração formal de Supabase Cloud → self-host (documentar como
ADR complementar quando chegar a hora). Monitorar de perto custos "escondidos" da AWS
(NAT Gateway, ALB, data transfer) ao desenhar a topologia de rede do self-host.

## Relacionado

- `ARQUITETURA_TECNICA.md` seção 2
- `ROADMAP_DE_EXECUCAO.md` Fases 5, 6 e 8
- ADR-0001, ADR-0003, ADR-0004
