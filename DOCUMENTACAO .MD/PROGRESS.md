# PROGRESS.md

Atualizado a cada sessão pelo Claude Code, ao final do trabalho. Este arquivo
substitui a necessidade de "lembrar" o que já foi feito — a memória do
projeto vive aqui, não na cabeça do agente.

---

## Estado atual

```text
Fase atual:        [nenhuma — projeto ainda não iniciado]
Último item feito: —
Próximo item:      Fase de Arquitetura (SPEC_MASTER §79) — decidir e
                    registrar ADR-0001 a ADR-0006 antes de codar
Stack definida:     NÃO (ver /adr/README.md)
Última atualização: —
Bloqueios abertos:  nenhum
```

---

## Checklist por fase (macro — ver detalhe fino na seção 104 do SPEC_MASTER)

### Fase 0 — Arquitetura (pré-requisito, não é uma das 8 fases do §81)
- [ ] ADR-0001 Stack geral
- [ ] ADR-0002 Banco/multi-tenancy
- [ ] ADR-0003 Auth
- [ ] ADR-0004 Storage
- [ ] ADR-0005 Payments
- [ ] ADR-0006 Deploy
- [ ] Plano de arquitetura apresentado e aprovado

### Fase 1 — Fundação
- [ ] Estrutura do projeto criada
- [ ] Autenticação (cadastro/login/logout/recuperação)
- [ ] Organização + tenant context
- [ ] RBAC básico
- [ ] Banco + isolamento multi-tenant implementado
- [ ] Layout base

### Fase 2 — Site
- [ ] Home institucional
- [ ] Página de planos
- [ ] Login / cadastro / recuperação (telas)
- [ ] Onboarding completo

### Fase 3 — Core Commerce
- [ ] Lojas (CRUD + slug)
- [ ] Categorias
- [ ] Produtos (com `product_type`)
- [ ] Clientes
- [ ] Carrinho
- [ ] Pedidos
- [ ] Cupons/Descontos

### Fase 4 — Theme Engine
- [ ] Theme Contract definido
- [ ] Theme Registry
- [ ] Aura Maison implementado
- [ ] Configuração de tema validada

### Fase 5 — Checkout
- [ ] Checkout desacoplado do tema
- [ ] Frete condicional (físico/digital)
- [ ] Pix
- [ ] WhatsApp
- [ ] Cancelamento/Reembolso

### Fase 6 — Billing
- [ ] Planos configuráveis
- [ ] Assinaturas
- [ ] PlanLimitService
- [ ] Feature flags/entitlements

### Fase 7 — Admin
- [ ] Painel de usuários
- [ ] Painel de organizações
- [ ] Painel de lojas
- [ ] Painel de planos
- [ ] Dashboard administrativo (métricas)
- [ ] Auditoria
- [ ] LGPD (exclusão/exportação de dados)

### Fase 8 — Escala
- [ ] Revisão de índices
- [ ] Revisão de queries
- [ ] Cache com contexto de tenant
- [ ] Storage com namespace por tenant
- [ ] Rate limiting
- [ ] Logs/observabilidade
- [ ] Testes de isolamento completos (Tenant A nunca acessa dado de Tenant B)
- [ ] Build de produção validado

---

## Histórico de sessões

> Cada sessão adiciona uma entrada aqui. Não apagar entradas antigas.

```text
[AAAA-MM-DD] — Resumo do que foi feito nesta sessão.
              Decisões tomadas: [ADR-XXXX, se houver]
              Pendências deixadas: [...]
```
