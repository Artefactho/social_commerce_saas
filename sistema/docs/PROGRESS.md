# PROGRESS.md

Atualizado a cada sessão pelo Claude Code, ao final do trabalho. Este arquivo
substitui a necessidade de "lembrar" o que já foi feito — a memória do projeto vive
aqui, não na cabeça do agente.

---

## Estado atual — Checkpoint 96fdef9

```text
Checkpoint Git:     96fdef9 (feat: checkpoint consolidado do commerce saas)
Branch / Remote:    main alinhada com origin/main (sincronizado)
Status das Fases:   Fase 0 [OK], Fase 1 [OK], Fase 2 [PARCIAL], Fase 3 [PARCIAL],
                    Fase 4 [OK], Fase 5 [PARCIAL], Fase 6 [FALTANDO],
                    Fase 7 [FALTANDO], Fase 8 [FALTANDO].
Último marco feito: Checkpoint oficial 96fdef9 consolidando: 13 docs de arquitetura,
                    5 temas oficiais (Base, Minimal, Aura Maison, Áurea Joalheria,
                    Jô Perfumes) no ThemeRegistry, VisualStoreEditor com live preview,
                    tokens CSS dinâmicos, frete condicional, WhatsApp checkout,
                    9 Edge Functions do Supabase (create-order, MP Connect/Callback,
                    Webhook, Cancelamento, Refund com CAS), 4 migrações SQL e
                    suíte de 95 testes (20 arquivos, 100% PASS local).
Evidências Reais:   - Isolamento multi-tenant e RLS: 12/12 SQL OK nos dois bancos.
                    - Edge Functions remotas: create-order testada com requests HTTP.
                    - Vitrine pública e DOM: 5 temas renderizados contra loja real.
                    - Testes locais Vitest: 95/95 PASS (unitários, DOM e adversariais).
Gaps em Aberto:     1. Gateway Mercado Pago Real: Chamadas reais de Pix/OAuth/Refund
                       ainda não validadas contra credenciais de produção de lojista.
                    2. Webhook Real: Não testado com requisições externas do MP.
                    3. Vínculo Customers ↔ Orders: Orders ainda gravam dados inline.
                    4. Tabela plans: Vazia no Supabase remoto (seed só local).
                    5. Deploy de Produção: Não realizado (nem Amplify nem Fargate).
Bloqueios abertos:  Nenhum bloqueio técnico. Próximo passo é teste de sandbox do MP.
```

**Nota histórica importante**: este projeto NÃO começa do zero. Existe um código
funcional real (React+Vite+Supabase, hoje em `SISTEMA SOCIAL COMMERCE/grace-and-grove-main`,
preservado como histórico fora de `/sistema`) com autenticação, onboarding, dashboard,
vitrine pública e checkout-UI já implementados e avaliados. Uma tentativa anterior em
Django (ferramenta Antigravity) existiu mas foi descartada pelo dono do produto (
interface ruim) e não está mais disponível — não é candidata a reaproveitamento de
código, só contexto histórico de que a documentação original serviu a duas tentativas
diferentes antes desta consolidação. Ver `VISAO_E_MODELO_DE_NEGOCIO.md` seção 8.

---

## Checklist por fase (detalhe fino de critério de aceite em `ROADMAP_DE_EXECUCAO.md`)

### Fase 0 — Arquitetura
- [x] ADR-0001 Stack geral
- [x] ADR-0002 Banco/multi-tenancy
- [x] ADR-0003 Auth
- [x] ADR-0004 Storage
- [x] ADR-0005 Payments
- [x] ADR-0006 Deploy
- [x] Plano de arquitetura apresentado e aprovado
- [x] Documentação consolidada (4 documentos + THEME_CONTRACT.md + adr/)

### Fase 1 — Fundação
- [x] Limpeza do código Lovable aplicada (lista CORTAR/MANTER; ver
      `docs/historico/` para o material arquivado do Lovable)
- [x] Squash das 28 migrations numa baseline única (validado localmente,
      nunca aplicado a projeto Supabase real)
- [x] Banco + isolamento multi-tenant validado (Tenant A/B) —
      `supabase/tests/isolation_test.sql`, 6/6 OK
- [x] `organizations` + `organization_members` criadas, com backfill
      automático das lojas já existentes
- [x] RBAC básico por loja (owner/admin/manager/staff) — validado: staff
      edita produtos da própria loja, não exclui a loja, não toca dado de
      outra organização; owner/admin conseguem excluir. **Validado nos dois
      ambientes**: local e projeto Supabase real (ubuuccnbqacozcdljuay).
- [x] Tabela de Store Configuration (`ThemeConfig` por loja) — trigger cria 1
      config por loja automaticamente; leitura pública, escrita por membro
      da organização. **Validado nos dois ambientes** (12/12 testes).
- [x] Criar o novo projeto Supabase real (ação manual, fora do Claude Code) e
      atualizar `frontend/.env` — feito (`ubuuccnbqacozcdljuay`); item ficou
      desatualizado no checklist, corrigido nesta sessão após conferência
      direta do `.env` real.

### Fase 2 — Site
- [x] Home institucional — `Index.tsx` real (não mockup), com seção
      "Como Funciona", "Recursos", "Templates" e uma seção-âncora "Preços"
      (`#precos`) na própria landing. Nunca validada formalmente contra o
      critério de aceite desta fase (mobile+desktop sem erros), mas
      funciona ao navegar manualmente.
- [x] Página de planos dedicada (`/planos`, `Planos.tsx`) — busca `plans`
      real, nomes oficiais BÁSICO/PRO/MASTER. A seção-âncora "Preços" da
      landing continua existindo (nomes antigos START/PRO/MASTER, não
      mexida), mas os links de navegação (nav+footer) agora apontam pra
      página real. **Nota**: a tabela `plans` está vazia tanto local quanto
      no projeto Supabase real — a página trata isso graciosamente
      ("Nenhum plano disponível"), mas em produção precisa que alguém
      cadastre os planos reais (seed real ou UI admin futura, Fase 7). A
      aba "Assinatura" no Dashboard (pós-login) continua sem cobrança real
      por trás — isso é a Fase 6.
- [x] Login / cadastro / recuperação de senha — `Auth.tsx` (login/signup via
      Supabase Auth, já ligado à criação de `organization`+`store`) +
      `ResetPassword.tsx` (fluxo padrão `resetPasswordForEmail` +
      `updateUser`). Validado ponta a ponta via Playwright+Mailpit local
      (e-mail real recebido, link real seguido, nova senha funcionando).
- [x] Onboarding completo ligado a Organization — termina criando
      `organization`+`store` de verdade (Fase 1).

### Fase 3 — Commerce Core
- [x] Lojas (CRUD + slug) — ligado a Organization desde a Fase 1
- [x] Categorias (tabela `categories` + UI completa: aba "Categorias" no
      dashboard, cria/lista/exclui; `ProductModal` já lê da tabela real em
      vez do dropdown fixo de antes).
- [x] Produtos com `product_type` (`physical`/`digital`) — campo no
      formulário de produto (ProductModal), frete condicional real no
      Checkout (regra inegociável #2: carrinho só com produto digital nunca
      mostra/cobra frete). **Validado via navegador real**: carrinho
      só-digital não mostra frete, carrinho com físico mostra.
- [x] Clientes (tabela `customers`, RLS: anon insere/nunca lê, org member lê
      os próprios). **Checkout ainda não cria o registro de cliente** — hoje
      continua gravando só os campos inline em `orders` (`customer_name`
      etc.), como já fazia antes; vincular pedido↔cliente fica em aberto.
- [x] Carrinho — já existia (Zustand), agora carrega `product_type`
- [x] Pedidos — já existia
- [x] Cupons/Descontos (tabela `coupons` + UI completa: aba "Cupons" no
      dashboard, cria/ativa-desativa/exclui; Checkout tem campo de aplicar
      cupom, escopado sempre por store_id+code — cupom de outra loja é
      rejeitado). **Validado via navegador real**: cupom de outra loja
      rejeitado, cupom da própria loja aplica desconto corretamente (10% de
      R$150 = -R$15, total R$135).

### Fase 4 — Theme Contract
- [x] Theme Contract adotado (`THEME_CONTRACT.md`)
- [x] Aura Maison adaptado do zip de referência para consumir dados reais —
      concluído E genericizado por completo (`frontend/src/features/
      theme/aura-maison/`); cupom não duplicado no tema (usa `/checkout`
      real). Ver FASE 4.1 abaixo — fechada em 2026-09-13, incluindo o
      diagnóstico e a ressalva sobre os 2 subitens que ainda dependem de
      schema novo (WhatsApp/endereço/redes sociais reais; rating/reviews/
      variantes de produto).
- [x] Configuração de tema por loja validada — nova aba "Tema" no Dashboard
      (2 cards: "Padrão" e "Aura Maison"), lê/grava
      `store_theme_configs.config.themeId` diretamente, sem migration nova.
      Validado via Playwright: ativar "Aura Maison" no Dashboard muda de
      verdade o que a vitrine pública (`/store/:slug`) renderiza, e voltar
      pra "Padrão" funciona também — troca nos dois sentidos confirmada.
- [x] UI de Store Configuration (nome/logo/cores) — item que faltava no
      roadmap (agora formalizado em `ROADMAP_DE_EXECUCAO.md`, ver "Nota de
      processo"). Nova aba "Configurações" no Dashboard: nome da loja
      (`stores.name`), upload de logo (`stores.logo_url`, reaproveitando o
      bucket `products` já existente — pasta `{store_id}/logo/`, mesmo
      padrão de imagem de produto, sem bucket/migration novos) e 2 cores
      (`store_theme_configs.config.colors.primary`/`.accentPromotion` —
      **não** `stores.primary_color`/`secondary_color`, colunas legadas do
      schema Lovable que nunca tiveram consumidor nem antes nem depois
      desta feature, documentado como ASSUMPTION no código). Efeito real
      confirmado, não só salvo: nome/logo mudam tanto na vitrine
      Aura Maison quanto no header do renderer genérico de 3 layouts
      (bônus, já que o logo é bem-vinda em qualquer tema); cor primária
      aplicada no botão "Sacola", CTA da Hero e pill de categoria ativa;
      cor de destaque aplicada nos contadores de carrinho/wishlist — todos
      no tema Aura Maison. **Limitação documentada, não lacuna silenciosa**:
      o renderer genérico de 3 layouts não tem conceito de cor por loja, só
      o Aura Maison usa `colors` hoje — texto explicativo disso já está no
      próprio formulário do Dashboard. Corrigido de passagem um bug latente
      que essa feature expôs: `store.logo_url`/`banner_url` nunca tinham
      tratamento de signed URL em `PublicStore.tsx` (só `products.image_url`
      tinha) — como logo nunca teve UI antes, nunca tinha sido exercitado;
      agora `logo_url` gera signed URL corretamente (mesmo padrão de
      `image_url`), `banner_url` continua sem esse tratamento (fora de
      escopo, nenhuma UI de upload de banner foi pedida/criada). Validado:
      `tsc`/`build` limpos, lint sem categoria de erro nova, Playwright
      confirmando persistência real após reload da página e o valor exato
      da cor escolhida aplicado via `getComputedStyle` no botão real da
      vitrine pública (não só "parece certo" numa screenshot).

## FASE 4.1 — Genericização completa do tema Aura Maison — ✅ COMPLETA (2026-09-13)

**Diagnóstico final**: `[OK]` para o objetivo real da fase (remover todo
conteúdo hardcoded fictício de joalheria e o cupom duplicado); `[PARTIAL]`
apenas nos 2 subitens que dependem de colunas de schema que não existem
hoje (WhatsApp/endereço/redes sociais reais; rating/reviews/variantes de
produto reais) — ambos tratados com ausência graciosa, não com dado
inventado, e documentados abaixo como trabalho futuro explícito, não como
lacuna silenciosa.

**Achado principal desta sessão**: ao auditar o código antes de começar a
reescrever qualquer coisa, ficou confirmado que **a fatia essencial da
Fase 4 já tinha entregado a genericização completa por acidente** — os
componentes do tema (`frontend/src/features/theme/aura-maison/`) foram
escritos do zero (para consumir dados reais desde o início), não copiados
e adaptados por find-replace do zip de referência. Como resultado, os
itens 1, 3, 4, 5, 6, 8 e 9 do levantamento abaixo (marca hardcoded,
categorias fixas, cupom duplicado, `CheckoutModal`/`AboutModal`, hero
específico de joias, CNPJ fake) **nunca existiram no código novo** — não
foi preciso removê-los agora porque nunca foram introduzidos. Confirmado
por auditoria rigorosa: grep de todo o diretório do tema por "AURA
MAISON", "Ouro 18k", "joalheria", `STORE_INFO`, `PROMO_COUPONS`, "CNPJ",
"WhatsApp", `5511987654321`, `CheckoutModal`, `AboutModal` — zero
ocorrências fora de comentários explicativos —, seguido de leitura
integral de cada um dos 11 arquivos do tema linha por linha.

**O que genuinamente restava e foi validado**: que o item 4 (cupom) de
fato manda para o `/checkout` real sem duplicar nada (confirmado: o
drawer do carrinho não tem campo de cupom, só o aviso informativo "Frete
e cupom são calculados na próxima etapa"); que `CheckoutModal`/
`AboutModal` de fato nunca foram trazidos para o projeto novo (non-issue,
confirmado por `ls` no diretório).

**Validação E2E desta sessão** (Playwright, Supabase local, `tsc`/`lint`/
`build` limpos primeiro): criada uma loja de nicho **deliberadamente
diferente de joalheria** ("TechGadgets Brasil", categoria Eletrônicos,
produto "Fone Bluetooth XPro") — justamente para que qualquer resíduo de
"Aura Maison"/joias que tivesse sobrado ficasse óbvio por contraste.
Confirmado na vitrine pública real: zero ocorrência de todos os termos
proibidos (AURA MAISON, Ouro 18k, joalheria, CNPJ fictício, WhatsApp fixo,
códigos de cupom do zip original); nome/categoria/produto reais aparecem
corretamente; cor primária e logo customizados (configurados via a aba
"Configurações" da sessão anterior) aplicados de verdade, com valor exato
confirmado via `getComputedStyle`; carrinho sem cupom duplicado e "Ir
para o Checkout" abrindo o `/checkout` real; quick view sem simulador de
CEP/WhatsApp; wishlist funcionando com o produto real. Zero erros de
console em qualquer página tocada.

**Nenhuma migration foi necessária ou criada** — consistente com o que
foi avisado ao usuário no início desta sessão (ver histórico de sessões).

Levantamento original (mantido abaixo como registro histórico do mapeamento
feito na Fase 4, incluindo os 2 itens que ficam como trabalho futuro):

**O problema**: o código de referência tem conteúdo de marca/negócio
**hardcoded para uma joalheria fictícia específica** ("Aura Maison"),
espalhado por praticamente todo componente — não é só trocar dado mockado
por dado real, é reescrever textos e substituir sistemas inteiros
duplicados para funcionar para qualquer lojista real.

**1. Marca hardcoded** (`Header.tsx`, `Footer.tsx`, drawer mobile do
Header): wordmark "AURA MAISON", monograma "AM", subtítulo "Haute
Curadoria"/"Haute Joaillerie" — precisa virar `store.name` +
logo/monograma real (`stores.logo_url`, com fallback pras iniciais do
nome).

**2. Objeto `STORE_INFO` hardcoded** (`src/data/products.ts` do tema),
referenciado em `Header` (link WhatsApp do menu 3), `Footer` (WhatsApp,
Instagram, endereço, telefone, e-mail), `CartDrawer` (limite de frete
grátis R$350 e custo de frete R$28 fixos, gerador de mensagem de pedido
via WhatsApp), `ProductModal` (mesmo limite de frete grátis no simulador
de CEP, link direto de compra via WhatsApp) — **todos com o número de
WhatsApp fixo `5511987654321` e nome "AURA MAISON" no texto da mensagem**.
Precisa de: (a) migration nova adicionando `stores.whatsapp_number`,
`stores.address` (não existem hoje — nem sequer coletados no onboarding);
(b) UI no onboarding/dashboard pra o lojista preencher esses campos; (c)
frete grátis/custo de frete usando os campos reais de `stores` (hoje só
existe `shipping_fee` fixo, sem conceito de "frete grátis acima de X").

**3. `CATEGORIES` hardcoded** (6 categorias fixas de joalheria: joias,
bolsas, perfumaria, vestuario, decor), referenciado em `Header` (dropdown
+ barra de navegação rápida), `CatalogSection` (pills de filtro + nome/
descrição da categoria ativa), `Footer` (coluna de links) — precisa virar
a tabela `categories` real (já existe desde a Fase 3), com fallback
gracioso quando a loja não tiver nenhuma categoria cadastrada ainda.

**4. Sistema de cupom PRÓPRIO do tema, duplicado e desconectado do
real**: `PROMO_COUPONS` (dicionário fixo client-side: AURA5, PRIMEIRACOMPRA,
BEMVINDO10, MAISON15) com validação e cálculo de desconto inteiros dentro
de `CartDrawer.tsx`, **sem nenhuma relação com a tabela `coupons` real
criada na Fase 3**. Decisão já tomada na fatia essencial: **não duplicar
isso** — o `CartDrawer` do tema deve só listar itens e mandar pro
`/checkout` real (que já tem cupom, frete condicional e criação de pedido
funcionando e testados). Na genericização completa, isso significa remover
por completo a UI de cupom de dentro do `CartDrawer`/`ProductModal` do
tema, não apenas trocar os dados.

**5. `CheckoutModal.tsx`** (não usado na fatia essencial): é um checkout
completo duplicado dentro do próprio tema, com seus próprios campos e
lógica de "pedido simulado". Decisão: **descartar esse arquivo por
completo** na integração — o app já tem `/checkout` real com Supabase,
cupom e frete condicional. Nunca deve ser ligado.

**6. `HeroCatalogBanner.tsx`**: subtítulo cita literalmente "joalheria fina
em ouro 18k, bolsas em couro nobre e perfumaria de nicho", imagem de fundo
fixa (foto de joia), botão secundário "Ver Novas Joias" apontando pra
categoria `joias` fixa. Precisa de copy genérica configurável (ou pelo
menos neutra o suficiente pra qualquer nicho) e imagem vindo de
`stores.banner_url` (com fallback gracioso — gradiente decorativo sem
foto — quando a loja não tiver banner configurado).

**7. `ProductModal.tsx` (quick view) e `ProductCard.tsx`**: assumem que
todo produto tem `rating`/`reviewsCount` (chamado sem optional chaining —
quebraria com produto real sem essas colunas, que não existem no schema),
`colors`/`sizes` (variantes — não existem no schema real, `products` não
tem tabela de variantes), `badge`/`material`/`dimensions` (campos que só
existem no mock). Todos precisam de fallback gracioso (esconder a seção
em vez de quebrar) — parte disso já foi resolvido na fatia essencial,
mas ratings/reviews/variantes de verdade exigiriam schema novo (fora de
escopo enquanto não houver uma feature de avaliações/variantes de produto
no roadmap).

**8. `Footer.tsx` completo**: CNPJ fictício hardcoded
("42.189.921/0001-84"), newsletter decorativa que não persiste em lugar
nenhum, link do Instagram apontando pro domínio genérico
`instagram.com` (não pro perfil real da loja) — a versão simplificada
usada na fatia essencial não tem nada disso; a versão completa precisaria
de campos reais de contato/redes sociais por loja (mesmos campos da
seção 2 acima) e decidir se vale a pena reconstruir a newsletter com
persistência real (fora de escopo do MVP).

**9. `AboutModal.tsx`** (não usado na fatia essencial): conteúdo estático
sobre a história/certificações da "Aura Maison" fictícia — precisaria
virar um campo de texto livre que o lojista preenche (não existe UI pra
isso em lugar nenhum ainda).

**Atualização (2026-09-13): Fase 4.1 fechada — ver diagnóstico no topo desta
seção.** Os itens 1, 3, 4, 5, 6, 8 e 9 acima já não se aplicam (nunca
existiram no código novo ou já foram tratados na fatia essencial). Só
ficam como trabalho futuro, fora do escopo de "genericização" porque são
**features novas** que dependem de schema ainda não decidido (não uma
correção de conteúdo fictício):
- Item 2 (WhatsApp/endereço/redes sociais reais) — precisa de migration
  nova em `stores` (`whatsapp_number`, `address`, talvez
  `instagram_handle`) + UI de onboarding/dashboard pra preencher. Fica
  como uma "Fase 4.2" não agendada, para quando o usuário priorizar.
- Item 7 (rating/reviews/variantes de produto reais) — precisa de schema
  novo de avaliações/variantes, fora do roadmap atual. Fallback gracioso
  já é suficiente para o MVP sem essa feature.

### Fase 2 — Site `[PARCIAL]`
- [x] Home institucional — `Index.tsx` real (não mockup), com seção "Como Funciona", "Recursos", "Templates" e seção-âncora "Preços".
- [x] Página de planos dedicada (`/planos`, `Planos.tsx`) — busca `plans` real.
- [!] **Pendência**: A tabela `plans` está vazia no projeto Supabase remoto (seed de planos aplicado somente no ambiente local).
- [x] Login / cadastro / recuperação de senha — `Auth.tsx` + `ResetPassword.tsx`.
- [x] Onboarding completo ligado a Organization — cria `organization` + `store` + `store_theme_configs` de verdade.
- [ ] **Deploy de produção**: Não realizado (Amplify Hosting).

### Fase 3 — Commerce Core `[PARCIAL]`
- [x] Lojas (CRUD + slug) — ligado a Organization.
- [x] Categorias (tabela `categories` + UI no dashboard + isolamento).
- [x] Produtos com `product_type` (`physical`/`digital`) — frete condicional real no Checkout.
- [x] Cupons/Descontos (tabela `coupons` + UI + escopo por loja no checkout).
- [x] Criação segura de pedidos no servidor (`create-order` Edge Function com validação de preços contra Postgres).
- [!] **Pendência**: A tabela `customers` existe e tem RLS, mas o checkout público ainda grava dados inline em `orders` sem criar/vincular formalmente o `customer_id`.

### Fase 4 — Theme Contract & Engine Visual `[OK]` (no escopo local/staging)
- [x] Theme Contract adotado (`skills/theme-contract.md` + `types/theme.ts`).
- [x] 5 temas oficiais implementados: Base Theme, Minimal Clean, Aura Maison, Áurea Joalheria e Jô Perfumes.
- [x] `ThemeRegistry.ts` dinâmico e desacoplado.
- [x] Injeção dinâmica de CSS variables (`themeTokens.ts`) no DOM.
- [x] Customizador visual (`VisualStoreEditor.tsx`) com Live Preview reativo.
- [x] Validado contra loja real no Supabase (`StorefrontDOMVerification.test.tsx`, `RealStoreAudit.test.ts`).
- [ ] **Deploy de produção**: Não realizado.

### Fase 5 — Checkout & Gateway Mercado Pago `[PARCIAL]`
- [x] Checkout desacoplado do tema (`Checkout.tsx` consumindo `useShippingCalculator` e `OrderService`).
- [x] Frete condicional e cálculo de frete grátis por loja.
- [x] Módulo e botão de finalização via WhatsApp (`whatsapp.ts`, `WhatsAppCheckoutDOM.test.tsx`).
- [x] Edge Functions Supabase escritas e migradas:
  - `create-order`: Criação transacional e idempotente.
  - `mercadopago-connect` & `mercadopago-callback`: OAuth Gateway para lojistas.
  - `mercadopago-webhook`: Notificações de pagamento com lock e idempotência.
  - `mercadopago-cancel-order` & `mercadopago-refund-order`: Cancelamento e estorno com Claim/CAS.
- [x] Suíte adversarial completa aprovada com mocks (`MercadoPagoAdversarialSuite.test.ts`, `OrderCancellationRefundSuite.test.ts`).
- [ ] **Integração Real Mercado Pago**: NÃO VALIDADA (pendente credenciais reais de lojista no sandbox/produção).
- [ ] **Webhook Real**: NÃO VALIDADO (pendente URL pública/ngrok recebendo evento real do MP).
- [ ] **Refund Real**: NÃO VALIDADO (pendente estorno real em conta bancária de teste).
- [ ] **Marco: primeiro deploy real** (Amplify + Supabase Cloud FREE) — pendente.

### Fase 6 — Billing `[FALTANDO]`
- [ ] Planos configuráveis
- [ ] Assinaturas
- [ ] Checagem de limite simples por plano
- [ ] Upgrade Supabase Cloud FREE → Pro

### Fase 7 — Admin `[FALTANDO]`
- [ ] Painel de usuários
- [ ] Painel de organizações
- [ ] Painel de lojas
- [ ] Painel de planos
- [ ] Dashboard administrativo (métricas)
- [ ] Auditoria
- [ ] LGPD (exclusão/exportação de dados)

### Fase 8 — Escala `[FALTANDO]`
- [ ] Revisão de índices e queries
- [ ] Cache com contexto de tenant
- [ ] Storage com namespace por tenant
- [ ] Rate limiting
- [ ] Logs/observabilidade
- [ ] Testes de isolamento completos em CI
- [ ] Migração Supabase Cloud → self-host AWS (`sa-east-1`)
- [ ] Build de produção validado

---

## Estado consolidado — checkpoint 96fdef9

```text
Checkpoint Git: 96fdef9
Branch:         main
Remote:         origin/main
Estado:         sincronizado

Fases:
Fase 0 — [OK]
Fase 1 — [OK]
Fase 2 — [PARCIAL]
Fase 3 — [PARCIAL]
Fase 4 — [OK]
Fase 5 — [PARCIAL]
Fase 6 — [FALTANDO]
Fase 7 — [FALTANDO]
Fase 8 — [FALTANDO]
```

### Detalhamento por Camada (Implementado vs Testado vs Real vs Produção)

| Camada / Funcionalidade | Código | Teste Local | Integração Remota | API Externa Real | Deploy Produção | Status Real |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Fase 0: Arquitetura & ADRs** | SIM | SIM | N/A | N/A | N/A | `[OK]` |
| **Fase 1: RLS & RBAC Multi-Tenant** | SIM | 12/12 SQL | SIM (Supabase Remoto) | N/A | NÃO | `[OK]` |
| **Fase 2: Landing, Auth & Onboarding** | SIM | 3/3 Vitest | PARCIAL (Plans vazios) | N/A | NÃO | `[PARCIAL]` |
| **Fase 3: Commerce Core & Hardening** | SIM | 20/20 SQL + Vitest | SIM (Supabase Remoto) | N/A | NÃO | `[PARCIAL]` |
| **Fase 4: 5 Temas & Editor Visual** | SIM | 26/26 Vitest/DOM | SIM (Loja real no DB) | N/A | NÃO | `[OK]` |
| **Fase 5: Checkout & Edge Functions MP** | SIM | 31/31 Adversarial | SIM (Edge Functions) | NÃO VALIDADO | NÃO | `[PARCIAL]` |
| **Fase 6: Billing SaaS** | NÃO | NÃO | NÃO | NÃO | NÃO | `[FALTANDO]` |
| **Fase 7: Super Admin** | NÃO | NÃO | NÃO | NÃO | NÃO | `[FALTANDO]` |
| **Fase 8: Escala & Self-Host** | NÃO | NÃO | NÃO | NÃO | NÃO | `[FALTANDO]` |

### Divergências Documentais Identificadas

```text
[DIVERGÊNCIA 1] — PROGRESS.md desatualizado
Documento: O arquivo parava na entrada de 2026-09-25 indicando Fase 5 como "NÃO INICIADA".
Código: O commit 96fdef9 contém 9 Edge Functions, 4 migrações SQL, 24 arquivos de teste e implementação completa de checkout, gateway e reembolso.
Resolução: Documentação atualizada para registrar todo o trabalho consolidado no checkpoint 96fdef9.

[DIVERGÊNCIA 2] — Evolução do Escopo de Temas
Documento: ROADMAP_DE_EXECUCAO.md original previa 1 tema oficial (Aura Maison).
Código: O projeto evoluiu para 5 temas oficiais (Base, Minimal, Aura Maison, Áurea Joalheria, Jô Perfumes) com ThemeRegistry dinâmico e VisualStoreEditor.
Resolução: Registrado como evolução do escopo da Fase 4, preservando o histórico original.

[DIVERGÊNCIA 3] — Vínculo de Clientes (customer-engine)
Documento: docs/architecture/customer-engine.md descreve vínculo formal customer_id em todo pedido.
Código: Checkout.tsx e create-order persistem dados do comprador inline em orders sem vincular à tabela customers.
Resolução: Registrado como pendência técnica da Fase 3/5 para alinhamento futuro.

[DIVERGÊNCIA 4] — Tabela plans no Supabase Remoto
Documento: Página /planos busca registros reais de plans.
Código / Ambiente: A tabela plans está povoada apenas no seed.sql local; no Supabase Cloud remoto permanece com 0 linhas.
Resolução: Registrado como pendência de dados no ambiente remoto.
```

### Principais Gaps Técnicos Atuais

1. **Mercado Pago Sandbox / API Real**: Realizar teste ponta a ponta de emissão de PIX com credenciais de teste reais nas Edge Functions remotas.
2. **Webhook Real do Mercado Pago**: Validar recepção de evento HTTP externo com assinatura via URL pública (ngrok/Cloudflare).
3. **Refund Real no Gateway**: Validar estorno de pagamento real através da API do Mercado Pago.
4. **Vínculo `customers ↔ orders`**: Ajustar `create-order` e checkout para gravação idempotente de clientes na tabela `customers`.
5. **População da tabela `plans` Remota**: Executar inserção dos planos oficiais no Supabase Cloud.
6. **Primeiro Deploy Real**: Configurar build e hosting no AWS Amplify Hosting apontando para o Supabase Cloud.

---

## Histórico de sessões

> Cada sessão adiciona uma entrada aqui. Não apagar entradas antigas.


```text
[2026-09-13] — Consolidação da documentação (Fase 0). Leitura completa dos 7 arquivos
              originais de /DOCUMENTACAO .MD e diagnóstico do código Lovable em
              /SISTEMA SOCIAL COMMERCE/grace-and-grove-main (28 migrations, stack
              real React+Vite+Supabase, React Router v6 — não Remix). Identificado
              que /TEMPLATES MODELO LOJA contém um Theme Contract já escrito (Aura
              Maison) e 5 protótipos visuais de temas futuros. Decididos e
              registrados os 6 ADRs pendentes. Criados os documentos consolidados
              em /sistema/docs.
              Decisões tomadas: ADR-0001 a ADR-0006 (ver /adr).
              Pendências deixadas: Etapa 2 (limpeza do código Lovable) e Etapa 3
              (squash de migrations) ainda não executadas — exigem confirmação
              explícita antes de cada ação destrutiva, conforme CLAUDE.md seção 6.

[2026-09-13] — Analisada também /TEMPLATES MODELO LOJA: identificado um
              Theme Contract já escrito (Aura Maison) adotado como
              docs/THEME_CONTRACT.md, e 5 protótipos HTML soltos catalogados
              como candidatos futuros de tema (só referência visual, sem
              código aproveitável). Aprovada e executada a limpeza do código
              Lovable (numa cópia em sistema/frontend, original preservado):
              código morto, componentes órfãos, 32 componentes shadcn sem uso,
              deps órfãs, artefatos do Lovable removidos; build e lint
              validados após a limpeza. Feito o squash das 28 migrations numa
              baseline única, validado do zero via Docker local (nunca contra
              projeto Supabase real) e testado com bateria de isolamento real
              (6/6 OK, incluindo IDOR e visão de admin). Montada a estrutura
              final completa de /sistema (docs, frontend, backend, supabase,
              infra, .github).
              Decisões tomadas: cortar todos os componentes shadcn sem uso
              real (sem exceção especulativa); manter package-lock.json/npm;
              criar um projeto Supabase novo em vez de reaproveitar o antigo
              (bfcnmhvjrujpyugnhbik).
              Pendências deixadas: `organizations`/`organization_members`/RBAC
              por loja (resto da Fase 1); criação manual do novo projeto
              Supabase real e atualização de `frontend/.env`; lixo de raiz
              (grace-and-grove-main.zip, .md solto, files.zip) ainda não
              removido, aguardando decisão explícita do usuário.

[2026-09-13] — Projeto Supabase novo criado pelo usuário
              (ubuuccnbqacozcdljuay); `.env` do frontend atualizado. Baseline
              squashada aplicada nesse projeto e revalidada com a bateria de
              isolamento (6/6 OK), schema idêntico ao local. Lixo de raiz
              removido (grace-and-grove-main.zip, .md solto, files.zip).
              Estabelecida regra permanente: trabalhar de forma autônoma
              seguindo sistema/docs/, sem pedir aprovação a cada passo, exceto
              nunca alterar o projeto Supabase real sem validar localmente e
              avisar antes. Implementada e validada a migration de
              organizations/organization_members/RBAC por loja
              (owner/admin/manager/staff), com bateria de testes estendida
              para 10 casos (6 de isolamento + 4 de RBAC). Aplicada no projeto
              Supabase real após aviso e confirmação, revalidada lá também
              (10/10 OK nos dois ambientes).
              Decisões tomadas: RBAC de exclusão de loja restrito a
              owner/admin; `owner_id` mantido em `stores` só como referência
              histórica, controle de acesso migrado para membership de
              organização.
              Pendências deixadas: Store Configuration (ThemeConfig por loja)
              — último item da Fase 1; depois, Fase 4 (adaptar o tema Aura
              Maison); senha do banco do projeto novo trocar quando o usuário
              quiser (ficou exposta na conversa por erro de digitação).

[2026-09-13] — Estabelecida regra permanente: trabalhar autonomamente
              seguindo sistema/docs/ (exceção fixa: nunca alterar o projeto
              Supabase real sem validar localmente e avisar antes).
              Implementada e validada (10/10, depois 12/12 com Store
              Configuration) a migration de organizations/RBAC, aplicada nos
              dois ambientes. Implementada e validada
              `store_theme_configs` (ThemeConfig por loja, trigger de
              criação automática), fechando a Fase 1 por completo — também
              aplicada e revalidada no projeto real após aviso. Ao fechar a
              Fase 1, encontrado e corrigido um bug real: o onboarding do
              frontend (`Onboarding.tsx`) ainda criava a loja direto, sem
              organização — quebraria com `organization_id` agora
              obrigatório. Corrigido para criar `organization` +
              `organization_member` (role owner) antes da loja.
              `types.ts` regenerado a partir do schema local, agora incluindo
              organizations/organization_members/store_theme_configs; build
              do frontend revalidado após a correção.
              Decisões tomadas: nenhuma nova além das já registradas.
              Pendências deixadas: Fase 2 (site institucional/planos) e
              Fase 4 (adaptar tema Aura Maison) são os próximos itens reais
              do roadmap; trocar a senha do banco do projeto real quando o
              usuário quiser.

[2026-09-13] — Validação da Fase 2 via app real rodando (Playwright +
              Chromium headless, local): home + seção de preços OK; fluxo
              cadastro→dashboard→onboarding→loja criada→dashboard testado
              de ponta a ponta contra Supabase local. Achado real durante o
              teste: o onboarding do frontend quebrava com "new row violates
              row-level security policy" ao criar a organização — o
              `.insert(...).select()` do Supabase vira `INSERT ... RETURNING`,
              e o Postgres reavalia a policy de SELECT nesse RETURNING; nesse
              instante o usuário ainda não era membro da organização recém-
              criada, então a policy bloqueava. Um segundo bug latente foi
              encontrado na mesma revisão: a policy antiga de auto-inserção
              em organization_members tinha uma subquery ambígua/auto-
              referenciada que a tornaria inútil assim que a tabela tivesse
              qualquer linha (o que o seed.sql já garante). Nenhum dos dois
              tinha sido pego pelos testes SQL anteriores porque eles
              inseriam esses dados como superusuário (bypassando RLS) só
              para montar o cenário, nunca exercitando essas policies como o
              role `authenticated` de verdade.
              Correção: substituídos os dois `.insert()` separados por uma
              função `create_organization()` SECURITY DEFINER (mesmo padrão
              de `has_role`/`is_org_member`) que cria a organização e insere
              o usuário como owner atomicamente, sem sofrer a reavaliação de
              RLS no meio do caminho — elimina os dois bugs de uma vez.
              Adicionado teste de regressão (13) que exercita esse fluxo
              como `authenticated` real, não mais como superusuário, para
              nunca mais passar despercebido. 13/13 testes OK localmente;
              fluxo real revalidado via Playwright após a correção (sem
              erros de console, sem requisições falhando, loja visível no
              dashboard).
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: Fase 4 (tema Aura Maison) é o próximo item
              real; Fase 3 completa (categorias/product_type/clientes) segue
              pendente também.

[2026-09-13] — Migration de correção aplicada e revalidada no projeto
              Supabase real após aviso e confirmação (13/13 testes OK lá
              também, incluindo o teste de regressão do bug de RETURNING).
              Fase 2 fechada por completo nos dois ambientes.

[2026-09-13] — Fase 3 (Commerce Core): criadas `categories` e `customers`
              (RLS incluindo o caso de privacidade de `customers` — anon
              insere mas nunca lê) e o campo `products.product_type`. Achada
              e documentada a mesma armadilha de RETURNING/RLS do bug
              anterior, agora em `customers` (anon não pode encadear
              `.select()` após inserir como convidado) — corrigida no teste
              e documentada na própria migration para quem for ligar isso no
              checkout depois. Implementada a peça de frontend mais crítica
              da Fase 3: seletor de tipo de produto no formulário
              (ProductModal) e frete condicional real no Checkout (regra
              inegociável #2 do CLAUDE.md) — carrinho só com produto digital
              nunca mostra nem cobra frete. 17/17 testes SQL localmente;
              build, `tsc --noEmit` e lint revalidados sem novos erros.
              Decisões tomadas: escopo da Fase 3 limitado a schema + a
              regra de frete condicional (a mais crítica, "inegociável");
              UI completa de gestão de categorias e o vínculo
              cliente↔pedido no checkout ficam como trabalho futuro em
              aberto, não construídos nesta rodada para não expandir escopo.
              Pendências deixadas: aplicar esta migration no projeto
              Supabase real; UI de categorias; vincular customers ao
              checkout; cupons/descontos (não iniciado); Fase 4 (tema Aura
              Maison) é o próximo item real após isso.

[2026-09-13] — Completada a Fase 3 do lado de código: UI de gestão de
              categorias (aba "Categorias" no dashboard) e cupons (tabela
              `coupons`, migration 20260913050000, + aba "Cupons"), com
              aplicação de cupom real no Checkout (sempre escopada por
              store_id+code, então cupom de outra loja é rejeitado
              naturalmente). `ProductModal` passou a ler categorias reais em
              vez do dropdown fixo. Bateria de testes SQL estendida pra 20
              casos (isolamento cruzado de categorias e cupons, privacidade
              de customers, escopo de cupom por loja) — 20/20 localmente.
              build/tsc/lint revalidados sem erros novos.
              PAUSADO no meio da validação E2E via navegador real (script
              Playwright de 11 passos já escrito e com 1 bug de seletor já
              corrigido) — máquina ficou sem memória (vmmemWSL/Docker
              consumindo 4,5GB, só 1,5GB livres no total). Usuário vai
              reiniciar o PC. Nenhuma das duas migrations novas
              (20260913040000, 20260913050000) foi aplicada no projeto
              Supabase real ainda — só testadas localmente.
              Decisões tomadas: nenhuma nova além das já registradas.
              Pendências deixadas: retomar exatamente pelos passos descritos
              na nota de pausa acima, após o reinício.

[2026-09-13] — Retomada a validação E2E da Fase 3 depois de uma
              interrupção de sessão (PC reiniciou por conta própria no meio
              do processo). Achado e corrigido um bug real que os 20 testes
              SQL não pegavam: a aba "Cupons" do dashboard quebrava a
              aplicação inteira (tela em branco, `ReferenceError: Label is
              not defined`) — o componente `Label` era usado no formulário
              de cupom mas nunca foi importado em `Dashboard.tsx`. Só
              apareceu ao clicar de verdade na aba num navegador; testes SQL
              não renderizam React, então não podiam ter pego isso.
              Corrigido (import faltante) e revalidado: build/tsc/lint
              limpos, e o fluxo completo de 11 passos via Playwright passou
              (categoria → cupom → produto físico → produto digital →
              vitrine pública → carrinho só-digital sem frete → carrinho com
              físico com frete → cupom de outra loja rejeitado → cupom certo
              aplicado com desconto correto → pedido confirmado).
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: aplicar as migrations 20260913040000 e
              20260913050000 no projeto Supabase real (aguardando aviso e
              confirmação); depois, Fase 4 é o próximo item real.

[2026-09-13] — Migrations 20260913040000 e 20260913050000 aplicadas no
              projeto Supabase real após aviso e confirmação. Bateria de
              20 testes SQL revalidada lá — 20/20 OK, paridade completa com
              o ambiente local. Fase 3 (Commerce Core) fechada por completo:
              categorias, product_type/frete condicional, clientes e cupons
              todos validados via SQL (isolamento/RBAC) e via navegador real
              (fluxo de compra ponta a ponta), nos dois ambientes.
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: Fase 4 (adaptar o tema Aura Maison) é o
              próximo item real do roadmap.

[2026-09-13] — Fase 4 (fatia essencial, Opção 2 já aprovada pelo usuário
              antes de uma interrupção de sessão por reinício do PC).
              Documentado em detalhe o escopo completo de genericização do
              zip de referência Aura Maison como "FASE 4.1 (futura)" neste
              arquivo, cobrindo: marca hardcoded (Header/Footer), objeto
              STORE_INFO e todos os consumidores (frete grátis fixo,
              WhatsApp fixo), CATEGORIES hardcoded, o sistema de cupom
              próprio do tema (PROMO_COUPONS em CartDrawer, duplicado e
              desconectado da tabela `coupons` real), CheckoutModal/
              AboutModal (a descartar), e os campos de schema que faltariam
              (`stores.whatsapp_number`/`address`, rating/variantes de
              produto). Depois, implementada a fatia essencial de verdade:
              novo tema `frontend/src/features/theme/aura-maison/`
              (TopBanner, Header, HeroCatalogBanner, FeaturesBar,
              CatalogSection, ProductCard, ProductQuickViewModal —
              renomeado do `ProductModal.tsx` original pra não colidir com
              o modal de CRUD do Dashboard —, CartDrawer simplificado sem
              cupom/frete/WhatsApp, WishlistDrawer, Footer genérico, e o
              orquestrador `AuraMaisonStorefront.tsx`), plugado em
              `PublicStore.tsx` por uma bifurcação em
              `store_theme_configs.config.themeId === "aura-maison"`
              (mantendo os 3 layouts genéricos existentes para as outras
              lojas). ASSUMPTION (baixo impacto, documentada em
              Header.tsx/Footer.tsx): nenhuma UI de WhatsApp foi incluída
              nesta fatia porque `stores.whatsapp_number` ainda não existe
              no schema — construir um link fixo/fake seria pior do que
              omitir; fica para a Fase 4.1 junto com o resto de STORE_INFO.
              Validado localmente: `tsc --noEmit` limpo, `npm run lint` sem
              nenhum erro novo, `npm run build` OK, e E2E visual via
              Playwright contra a loja `loja-a` do seed (já tem `themeId:
              "aura-maison"`) — nome/produto/categoria reais aparecem, zero
              texto "Aura Maison"/joalheria hardcoded, adicionar ao
              carrinho, abrir o drawer (sem campo de cupom), navegar de
              fato para `/checkout`, quick view e wishlist todos passaram
              sem erro de console nem requisição falha. Nenhuma migration
              nova nesta etapa, então nada foi aplicado/precisa ser avisado
              no projeto Supabase real. Ambiente local limpo ao final
              (dev server encerrado, `.env.local` removido, `supabase
              stop`).
              Decisões tomadas: nenhuma nova além da ASSUMPTION acima.
              Pendências deixadas: "Configuração de tema por loja validada"
              (UI no Dashboard pra trocar/ajustar tema — hoje só via SQL);
              Fase 4.1 completa (genericização de marca/WhatsApp/rodapé/
              cupom do tema) só quando explicitamente pedida; Fase 5
              (Checkout desacoplado de verdade) é o próximo item do
              roadmap principal.

[2026-09-13] — Pedido explícito do usuário para fechar 3 pendências
              pequenas de baixo risco, sem tocar o Supabase real, e para
              NÃO iniciar Fase 4.1 nem Fase 5 nesta sessão mesmo com a
              regra de trabalho autônomo permitindo. As 3 fechadas:
              (1) recuperação de senha (Auth.tsx modo "forgot" +
              ResetPassword.tsx), (2) página /planos dedicada com dados
              reais da tabela `plans` (Planos.tsx), (3) UI de troca de tema
              no Dashboard (aba "Tema", grava
              store_theme_configs.config.themeId). Detalhe técnico
              relevante: `supabase/config.toml` estava vazio, fazendo o
              GoTrue local redirecionar links de e-mail pro
              `site_url` default do CLI (porta 3000) em vez da porta real
              do Vite (8080) — corrigido com um bloco `[auth]` mínimo
              (site_url + additional_redirect_urls). Isso só cobre o
              ambiente local; o projeto Supabase real vai precisar da
              mesma configuração via painel quando houver um domínio de
              produção real (Fase 5/deploy). Também corrigidos de
              passagem, por estarem na mesma linha/arquivo já em edição:
              um `href` errado no footer da landing ("Templates" apontava
              pra `#precos`) e uma condição de fallback no Dashboard que
              não excluía a aba "plans" (podia renderizar conteúdo
              duplicado). Adicionado seed local de 3 planos (BÁSICO/PRO/
              MASTER) só em `supabase/seed.sql`, nunca aplicado à nuvem —
              a tabela `plans` real continua vazia nos dois ambientes.
              Validação: `tsc --noEmit` limpo, `npm run build` OK,
              `npm run lint` sem categoria de erro nova (só o mesmo padrão
              pré-existente de `any`), e E2E completo via Playwright +
              Mailpit local para os 3 itens — incluindo o fluxo de
              recuperação de senha ponta a ponta de verdade (e-mail real
              recebido e seguido, nova senha efetivamente funcionando no
              login). Corrigido também, por observação direta do usuário,
              um item desatualizado no checklist da Fase 1 (projeto
              Supabase real e `.env` já existiam, só não estavam marcados).
              Decisões tomadas: nomes de plano na página /planos seguem os
              oficiais da documentação de negócio (BÁSICO/PRO/MASTER), não
              os nomes antigos da landing (START/PRO/MASTER) — a landing em
              si não foi alterada além dos links de navegação.
              Pendências deixadas: Fase 4.1 (genericização completa do Aura
              Maison) e Fase 5 (Checkout desacoplado, Pix real, WhatsApp,
              deploy real) — não iniciadas por pedido explícito, ficam para
              uma sessão nova. Nomes de plano inconsistentes entre a landing
              (START/PRO/MASTER) e /planos (BÁSICO/PRO/MASTER) não
              unificados. Configuração de `site_url`/redirect no projeto
              Supabase real ainda não existe (só faz sentido quando houver
              domínio de produção).

[2026-09-13] — Bug reportado pelo usuário testando o onboarding no
              navegador: no passo 3 ("Visual"), a thumbnail do template
              Aura Maison aparecia quebrada e o botão de preview (olhinho)
              não abria nada. Causa raiz: `templates.thumbnail_url`,
              `preview_url` e `description` nunca foram preenchidos no
              seed local (INSERT só tinha id/name/layout_key/active),
              ficando `NULL` — `<img src={null}>` renderiza quebrado e
              `window.open(null)` não abre nada visível. Corrigido em duas
              frentes: (1) `seed.sql` agora preenche os 3 campos pro
              template Aura Maison (thumbnail de estoque só pra
              demonstração local, `preview_url` apontando pra `/store/
              loja-a`, que já roda esse tema de verdade); (2)
              `Onboarding.tsx` ganhou fallback gracioso pros dois casos —
              sem `thumbnail_url` mostra um placeholder decorativo em vez
              de `<img>` quebrado, sem `preview_url` o botão de preview
              nem aparece (evita abrir uma aba em branco sem explicação) —
              relevante pra quando um lojista real cadastrar um tema sem
              esses campos ainda preenchidos. Validado: `tsc`/`build`
              limpos, lint sem erro novo, e Playwright confirmando a
              imagem carregando de verdade (`naturalWidth > 0`) e o botão
              de preview abrindo `/store/loja-a` de verdade. `supabase db
              reset` rodado pra aplicar o seed corrigido no ambiente local
              que já estava no ar pro usuário testar (dev server não
              precisou reiniciar, só o banco — dados anteriores criados
              pelo usuário nesse ambiente foram perdidos no reset, mesmo
              comportamento already esperado de `db reset`).
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: as mesmas da entrada anterior (Fase 4.1,
              Fase 5). Vale considerar, numa sessão futura que mexer em
              onboarding/templates de novo, se outros campos opcionais de
              `templates` (`marketplace_price`) também merecem fallback
              — não verificado agora por não ter sido reportado.

[2026-09-13] — Implementada a UI de Store Configuration (nome/logo/cores)
              pedida pelo usuário depois de perguntar como editar isso e eu
              apontar que era uma promessa da visão de produto nunca
              formalizada no roadmap. Nova aba "Configurações" no
              Dashboard. Decisão arquitetural registrada: nome/logo vão em
              `stores` (universais, qualquer tema); cores vão em
              `store_theme_configs.config.colors` (Theme Contract), não nas
              colunas legadas `stores.primary_color`/`secondary_color`
              (confirmado sem nenhum consumidor em lugar nenhum do código,
              antes ou depois desta feature — ficam como estão, candidatas
              a limpeza numa migration futura, não tocadas agora). Logo
              reaproveita o bucket `products` já existente (pasta
              `{store_id}/logo/`), sem bucket nem migration novos. Cores
              aplicadas de verdade (não só salvas) em 4 pontos do tema Aura
              Maison: botão "Sacola" do Header, CTA da Hero, pill de
              categoria ativa (cor primária) e contadores de carrinho/
              wishlist (cor de destaque) — documentado explicitamente no
              próprio formulário que isso só vale pro Aura Maison, o
              renderer genérico de 3 layouts não tem esse conceito ainda.
              Logo também exibido no header do renderer genérico (bônus,
              baixo risco). Bug latente encontrado e corrigido no caminho:
              `PublicStore.tsx` nunca gerava signed URL pra
              `store.logo_url` (só fazia isso para `products.image_url`) —
              nunca tinha sido percebido porque não existia UI pra setar um
              logo antes de agora; corrigido só para `logo_url`,
              `banner_url` deixado como está (fora de escopo, sem UI de
              upload de banner pedida). Também atualizado
              `ROADMAP_DE_EXECUCAO.md` com uma seção nova, "Nota de
              processo — checagem Visão vs Roadmap", registrando a lição
              pedida explicitamente pelo usuário: promessas de
              `VISAO_E_MODELO_DE_NEGOCIO.md` sem contrapartida testável no
              roadmap são uma lacuna de processo, não "ainda não
              priorizada" por padrão — sessões futuras que revisarem o
              roadmap ou fecharem uma fase devem varrer a visão de produto
              em busca desse tipo de promessa esquecida.
              Validação: `tsc --noEmit` limpo, `npm run build` OK,
              `npm run lint` sem categoria de erro nova (56 erros, todos
              `no-explicit-any`/pré-existentes, mesmo padrão do resto do
              arquivo). E2E via Playwright: criou loja, ativou Aura Maison,
              preencheu nome/logo/2 cores, salvou, **recarregou a página**
              e confirmou que os valores persistiram de verdade (não só em
              memória), depois confirmou na vitrine pública que o nome
              mudou, o logo apareceu e a cor do botão "Sacola" bate
              exatamente (via `getComputedStyle`, não só inspeção visual)
              com o hex escolhido. Zero erros de console em qualquer
              página tocada. Ambiente do usuário (dev server + Supabase
              local) não precisou reiniciar — sem migration nova, HMR do
              Vite absorveu as mudanças de código sozinho; dados que o
              usuário já tinha criado no ambiente não foram apagados desta
              vez (diferente da correção anterior, que exigiu `db reset`).
              Decisões tomadas: colors em `store_theme_configs`, não em
              `stores.*_color` (ver acima). Nomes dos campos "Cor primária"
              e "Cor de destaque" seguem literalmente os nomes já
              documentados em `THEME_CONTRACT.md` (`colors.primary`,
              `colors.accentPromotion`), não inventados.
              Pendências deixadas: Fase 4.1 (genericização completa) e
              Fase 5 (Checkout/deploy) continuam como próximos itens reais
              do roadmap, não iniciadas. Aplicar cor por loja também no
              renderer genérico de 3 layouts fica como possível follow-up,
              não decidido ainda se vale a pena dado que esse renderer é
              pré-Theme-Contract. Limpeza das colunas legadas
              `stores.primary_color`/`secondary_color` (confirmadas mortas)
              fica para uma migration futura, junto de outras limpezas de
              schema — não urgente, não tocado agora.

[2026-09-13] — Fase 4.1 (genericização completa do Aura Maison) pedida
              explicitamente, com instrução de trabalhar de forma autônoma
              (sem migration nova) mas parar e avisar se descobrisse que
              precisava de campo novo no banco. Aviso dado logo no início:
              o levantamento original desta própria seção já dizia que
              WhatsApp/endereço precisariam de migration — o usuário já
              sabia disso e pediu para eu seguir em frente mesmo assim,
              tratando esses 2 subitens com ausência graciosa (não
              inventando dado), então nenhuma pausa real foi necessária.
              Antes de reescrever qualquer coisa, fiz uma auditoria
              completa do diretório do tema (grep por todos os termos do
              levantamento original + leitura integral dos 11 arquivos) e
              descobri que a genericização já estava, na prática, feita —
              a fatia essencial da Fase 4 escreveu os componentes do zero
              (não copiou+adaptou o zip original por find-replace), então
              o conteúdo fictício de joalheria simplesmente nunca foi
              introduzido no código novo. `CheckoutModal.tsx`/
              `AboutModal.tsx` também nunca foram trazidos pro projeto —
              non-issue confirmado por `ls`. Isso significa que o trabalho
              real desta sessão foi principalmente uma auditoria de
              confirmação com rigor, não uma reescrita — reportado ao
              usuário com total transparência em vez de fingir uma
              reescrita que não foi necessária.
              Validação (checkpoints intermediários, como pedido): `tsc`/
              `lint`/`build` como baseline antes de qualquer coisa (limpo,
              mesma contagem de erros pré-existentes de antes); E2E via
              Playwright criando uma loja de nicho deliberadamente
              diferente ("TechGadgets Brasil", eletrônicos) — escolhida de
              propósito para que qualquer resíduo de "Aura Maison"/joias
              ficasse óbvio por contraste — confirmando zero ocorrência de
              todos os termos proibidos do levantamento (marca, CNPJ fake,
              WhatsApp fixo, códigos de cupom do zip original) em toda a
              vitrine pública renderizada, nome/categoria/produto reais
              corretos, cor primária e logo customizados (da feature de
              Store Configuration da sessão anterior) aplicados de
              verdade, carrinho sem cupom duplicado indo pro `/checkout`
              real, quick view sem CEP/WhatsApp, wishlist funcionando,
              zero erros de console em qualquer página. Ambiente local
              limpo ao final (dev server encerrado, `.env.local` removido,
              `supabase stop`). Nenhuma migration nova foi criada.
              Decisões tomadas: nenhuma nova além da já avisada no início
              (WhatsApp/endereço ficam de fora, ausência graciosa).
              Pendências deixadas: os 2 subitens que dependem de schema
              novo (WhatsApp/endereço/redes sociais reais; rating/reviews/
              variantes de produto) ficam como trabalho futuro explícito,
              sem fase numerada atribuída — só quando o usuário priorizar.
              Fase 5 (Checkout desacoplado de verdade, Pix real, WhatsApp,
              deploy real) é o próximo item real do roadmap principal.

[2026-09-17] — Resolvida a pendência de segurança em aberto desde
              2026-09-13: a senha do banco do projeto Supabase real
              (ubuuccnbqacozcdljuay), que havia sido exposta numa conversa
              anterior por erro de digitação do usuário, foi trocada pelo
              usuário via Project Settings → Database no painel do
              Supabase. A geração/cópia da nova senha foi feita pelo próprio
              usuário no terminal dele (fora desta sessão do Claude Code),
              para que o valor nunca precisasse aparecer na conversa.
              Confirmado que nenhum arquivo do repositório precisava ser
              atualizado: `frontend/.env`/`.env.example` só guardam
              `VITE_SUPABASE_PROJECT_ID`/`VITE_SUPABASE_PUBLISHABLE_KEY`/
              `VITE_SUPABASE_URL` (chave anon pública), nunca a senha do
              Postgres.
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: nenhuma relacionada a este item. Próximos
              passos combinados com o usuário: reimportar o kit SDD/skills
              (tentativa anterior não chegou a ser aplicada — nada
              encontrado em `sistema/docs/`, `.claude/` do projeto nem em
              `~/.claude/` global), depois iniciar a Fase 5 (Checkout
              desacoplado, Pix real, WhatsApp, deploy real).

[2026-09-17] — Aplicado o kit SDD (Spec Driven Development) trazido pelo usuário de
              outro projeto (Dashboard Jurídico), adaptado ao que já existe aqui,
              não copiado às cegas — proposta apresentada item a item e aprovada
              antes de qualquer edição. 5 itens aplicados em sistema/docs/:
              (1) nova subseção 5.4 em CLAUDE.md — "Princípio da complexidade
              justificada", com exemplo real do projeto (Fase 4.1); (2) skill nova
              skills/avatar-e-arquivo.md, com o padrão real de upload/storage já
              usado (bucket `products` privado, RLS por pasta, signed URL de 1 ano,
              nome de arquivo gerado no cliente) documentado a partir do código
              (ProductModal.tsx, Dashboard.tsx), não do texto genérico de
              referência — inclui a ressalva de que o padrão de "signed URL longa"
              não deve ser herdado automaticamente se um arquivo sensível de
              verdade (documento pessoal) aparecer no futuro; (3) gatilho de
              conclusão de fase em CLAUDE.md seção 6 recebeu só uma referência
              cruzada nova a CRITERIOS_DE_ACEITE.md — os dois gatilhos que o kit
              propunha (diagnóstico [OK]/[PARTIAL]/[MISSING]/[PROBLEM] e regressão)
              já existiam quase palavra por palavra, então não foram duplicados;
              (4) parágrafo novo na seção 4 do CLAUDE.md pedindo handoff curto em
              PROGRESS.md a cada fase/subfase concluída, não só ao final da
              sessão inteira; (5) THEME_CONTRACT.md movido para
              skills/theme-contract.md, com skills/ formalizada como pasta irmã
              dos documentos de processo e uma seção nova 7.1 no CLAUDE.md
              explicando quando criar skill nova em vez de inchar
              ARQUITETURA_TECNICA.md. Referências atualizadas nos 7 arquivos
              combinados: CLAUDE.md (4 ocorrências), ROADMAP_DE_EXECUCAO.md,
              VISAO_E_MODELO_DE_NEGOCIO.md (2 ocorrências), ARQUITETURA_TECNICA.md
              e sistema/README.md.
              Decisões tomadas: manter o nome avatar-e-arquivo.md mesmo o
              conteúdo real sendo sobre logo de loja/imagem de produto, não avatar
              pessoal (ASSUMPTION de baixo impacto, aprovada explicitamente pelo
              usuário); não traduzir os rótulos [OK]/[PARTIAL]/[MISSING]/[PROBLEM]
              para português, para não quebrar a consistência já estabelecida em
              CRITERIOS_DE_ACEITE.md e no diagnóstico real da Fase 4.1; não
              reescrever as 4 menções históricas a THEME_CONTRACT.md dentro do
              próprio histórico de sessões deste arquivo (linhas 89, 160, 409, 770)
              — são registro do que aconteceu naquela data, não ponteiro vivo.
              Encontradas também 6 referências a THEME_CONTRACT.md em comentários
              de código (supabase/seed.sql,
              supabase/migrations/20260913020000_store_theme_config.sql,
              frontend/src/features/theme/aura-maison/Header.tsx,
              frontend/src/pages/Dashboard.tsx 2x), fora do escopo dos 7 arquivos
              de documentação aprovados inicialmente — reportadas ao usuário em
              vez de corrigidas em silêncio, e atualizadas na sequência, ainda
              na mesma sessão, após aprovação explícita. Migration já aplicada
              nos dois ambientes (local e Supabase real) não precisou ser
              reaplicada — a edição foi só no comentário SQL, nenhuma mudança de
              schema/dado.
              Decisões tomadas (complemento): nenhuma nova.
              Pendências deixadas: nenhuma relacionada ao kit SDD/skills — as 13
              referências a THEME_CONTRACT.md (7 docs + 6 comentários de código)
              foram todas atualizadas para skills/theme-contract.md; restam só as
              4 menções históricas do próprio histórico de sessões acima (linhas
              89, 160, 409, 770), preservadas de propósito. Próximo item real do
              roadmap principal segue sendo a Fase 5 (Checkout desacoplado, Pix
              real, WhatsApp, deploy real) — ainda não iniciada.

[2026-09-17] — Segundo tema real implementado, a pedido explícito do usuário e
              ANTES da Fase 5 (que segue não iniciada): `aurea-joalheria`
              (`frontend/src/features/theme/aurea-joalheria/`), a partir do
              template estático `/TEMPLATES MODELO LOJA/
              gemini-code-1787034988017.html` ("Aurea Joalheria"). Mesmo padrão
              do Aura Maison (Fase 4): 11 componentes + orquestrador
              `AureaJoalheriaStorefront.tsx` escritos do zero consumindo dados
              reais (useCart/useWishlist, checkout sempre `/checkout` real),
              plugado em `PublicStore.tsx` via `themeId === "aurea-joalheria"`.
              Só a identidade visual do template foi extraída (paleta ônix+ouro,
              tipografia Cinzel/Montserrat, layout de card/header/drawer) — nada
              do HTML/JS original foi copiado. Reaproveitadas as strings de copy
              já genéricas do Aura Maison (Hero, FeaturesBar, TopBanner, Footer,
              drawers) em vez de escrever texto de marketing novo — decisão
              registrada como o principal checklist item no adendo da skill (ver
              abaixo), para não arriscar reintroduzir suposição de nicho.
              Tipografia própria (Cinzel/Montserrat) carregada via `<link>`
              injetado em `useEffect` só quando este tema monta, com override de
              `.font-heading` escopado por especificidade CSS — `index.css`/
              `tailwind.config.ts` globais (Space Grotesk/Plus Jakarta Sans, usados
              pelo resto do app) não foram tocados. Nenhuma migration nova;
              ativação continua via `store_theme_configs.config.themeId` (aba
              "Tema" do Dashboard ainda não lista esse tema — só "Padrão"/"Aura
              Maison" — ativação usada nesta sessão foi via SQL direto, decisão de
              expor isso na UI do lojista fica para quando o usuário priorizar).
              Validação (mesmo rigor do Aura Maison/Fase 4.1): `tsc --noEmit`
              limpo; `npm run build` sem erro novo; `npm run lint` com a mesma
              contagem de 56 problemas pré-existentes (nenhum arquivo novo
              aparece no lint). E2E via Playwright/Chromium real (ambiente
              instalado num projeto Node descartável fora de `frontend/`, sem
              tocar `package.json` da aplicação) contra uma loja de nicho
              deliberadamente diferente ("TechGadgets Brasil", Eletrônicos,
              inserida direto via SQL no Supabase local por velocidade — dados
              efêmeros, só no ambiente local) — 10/10 checks PASS: zero termos do
              template fictício de joalheria na página renderizada; nome/
              categoria/produto reais corretos; paleta ônix/dourado e tipografia
              Cinzel aplicadas de verdade (computed style, não só visual);
              adicionar ao carrinho atualiza contador; drawer do carrinho mostra
              o item real e "Ir para o Checkout" navega de fato para `/checkout`
              real; quick view abre com dado real; favoritar funciona; zero erros
              de console em todo o percurso. Screenshots conferidos visualmente
              (storefront, drawer, quick view) além dos checks automatizados.
              Escrito um adendo (seção 13) em `skills/theme-contract.md`:
              "Checklist para adaptar um novo template visual", documentando os 6
              passos seguidos aqui para servir de guia nos próximos templates de
              `/TEMPLATES MODELO LOJA`. Ambiente de validação local encerrado ao
              final (dev server parado, `.env.local` removido, `supabase stop`).
              Decisões tomadas: nenhuma nova além das já documentadas no adendo da
              skill (cores só `{primary, accentPromotion}`, fonte escopada por
              tema, copy reaproveitado em vez de reescrito).
              Pendências deixadas: aba "Tema" do Dashboard não lista
              "aurea-joalheria" (só ativável via SQL direto hoje); UI de seleção
              desse tema pro lojista fica como trabalho futuro explícito, sem
              fase numerada atribuída. **Por pedido explícito do usuário, os
              outros 4 templates de `/TEMPLATES MODELO LOJA` e a Fase 5 não devem
              ser iniciados sem confirmação — resumo e validação apresentados,
              aguardando decisão do usuário sobre o próximo passo.**

[2026-09-17] — A pedido do usuário (depois de perguntar por que "Aurea
              Joalheria" não aparecia no passo "escolha identidade" do
              onboarding), exposto esse tema nos dois lugares que faltavam pra
              ativação real pela interface, sem mexer no projeto Supabase real:
              (1) nova linha em `public.templates` (`layout_key:
              "aurea-joalheria"`, escolhido porque `layout_key` tem constraint
              UNIQUE e "premium" já pertence ao Aura Maison — o valor em si não
              afeta renderização, já que `PublicStore.tsx` desvia pro
              `AureaJoalheriaStorefront` antes de olhar `layout_key`),
              adicionada em `supabase/seed.sql` (reaplicada no ambiente local
              rodando via REST API/`service_role`, não via migration) e também
              já inserida no Supabase local em uso; (2) terceira entrada no
              array hardcoded da aba "Tema" do `Dashboard.tsx` (ao lado de
              "Padrão" e "Aura Maison"). `thumbnail_url`/`preview_url`
              deixados `NULL` de propósito (ASSUMPTION, baixo impacto): não há
              loja seedada de verdade rodando esse tema ainda nem imagem de
              estoque verificada — o onboarding já trata os dois campos
              ausentes de forma graciosa (fallback decorativo, sem botão de
              preview), documentado como pendência explícita, não lacuna
              silenciosa. Validado: `tsc --noEmit` limpo; onboarding (chave
              anon) e Dashboard já enxergam as duas linhas via REST.
              Nota lateral de ambiente (não é bug do produto): `psql` dentro do
              container `supabase_db_saas-social-commerce` começou a
              segfaultar (exit 139) no meio da sessão, mesmo com o container
              saudável e memória normal (Postgres seguindo os checkpoints
              normalmente nos logs) — contornado usando a REST API
              (PostgREST) com a `service_role` key em vez de `docker exec
              psql`. Não investigado a fundo (não pareceu bloquear nada real);
              se voltar a acontecer numa sessão futura, vale registrar e
              investigar com mais tempo.

              **Lacuna de arquitetura encontrada e registrada a pedido do
              usuário (não corrigir agora — só documentar para o próximo ciclo
              de planejamento do sistema de temas):** o onboarding (passo
              "escolha identidade da sua loja") e o Theme Contract real
              (`store_theme_configs.config.themeId`, o que de fato ativa
              `AuraMaisonStorefront`/`AureaJoalheriaStorefront` em
              `PublicStore.tsx`) são **dois mecanismos desconectados**. O
              onboarding só grava `stores.active_template_id` + uma linha em
              `store_templates` — isso alimenta o renderer genérico de 3
              layouts (minimal/bold/premium) e a galeria de thumbnails do
              onboarding, mas **não** ativa o tema oficial de verdade. Hoje um
              lojista que escolhe "Aura Maison" (ou agora "Aurea Joalheria")
              no onboarding continua vendo o renderer genérico até ativar o
              mesmo tema de novo, manualmente, na aba "Tema" do Dashboard —
              dois passos redundantes e potencialmente confusos, sem nenhum
              aviso disso pro lojista. Isso já era assim antes desta sessão
              (não foi introduzido agora); só ficou visível ao investigar por
              que o tema novo não aparecia no onboarding. Fica para uma sessão
              futura que revisar o fluxo de onboarding ou o sistema de temas
              como um todo decidir: unificar os dois (onboarding grava
              `themeId` direto) ou remover a escolha de "identidade" do
              onboarding e deixar isso só para a aba Tema do Dashboard.
              Decisões tomadas: layout_key `"aurea-joalheria"` pro novo
              template (ver acima); thumbnail/preview NULL por enquanto.
              Pendências deixadas: preencher thumbnail_url/preview_url reais
              do template Aurea Joalheria quando houver loja seedada rodando
              esse tema; decidir e implementar a unificação onboarding↔Theme
              Contract (lacuna documentada acima); aplicar essas mesmas
              mudanças de dado no projeto Supabase real fica pendente,
              não feito nesta sessão (só ambiente local). Próximo item real do
              roadmap principal segue sendo a Fase 5, ainda não iniciada — os
              outros 4 templates de `/TEMPLATES MODELO LOJA` também seguem sem
              confirmação do usuário.

[2026-09-17] — Adicionada a imagem de capa que faltava no card "Aurea
              Joalheria" do onboarding (usuário reportou: card aparecia só com
              ícone genérico, diferente do Aura Maison que tem foto real). A
              pedido explícito do usuário, usado um screenshot real da própria
              loja de teste (techgadgets-brasil) rodando o tema — via
              Playwright, viewport 960x1200 (proporção 4:5, igual o card do
              onboarding) — em vez de uma foto de banco de imagens genérica
              como o Aura Maison usa. Upload feito no bucket `products`
              (service_role, caminho `templates/<id>/thumbnail.png` — fora do
              padrão `{store_id}/...` de proposito, já que não pertence a
              nenhuma loja), resolvido como signed URL de 1 ano (mesmo padrão
              de `product.image_url`/`store.logo_url`) gravada direto em
              `templates.thumbnail_url`. Validado: a signed URL responde
              200/image/png de verdade (não só "parece certo"); onboarding
              renderiza `<img src={thumbnail_url}>` sem nenhuma resolução
              adicional de signed URL no código (confirmado lendo
              `Onboarding.tsx`), então gravar a URL já resolvida era
              necessário — gravar só o caminho bruto (como é o padrão pra
              produto/logo) teria ficado quebrado ali, a menos que
              `Onboarding.tsx` também ganhasse lógica de resolução, o que não
              foi pedido nem feito.
              Decisões tomadas: caminho `templates/<id>/...` no bucket
              `products` para asset que não pertence a nenhuma loja (variação
              de baixo impacto sobre o padrão `{store_id}/...` já existente).
              Pendências deixadas / limitação documentada (ASSUMPTION, baixo
              impacto): a URL assinada só funciona enquanto o objeto existir
              no storage local — um `supabase db reset` recria
              `storage.objects` mas não reenvia o arquivo sozinho, então após
              um reset o upload precisa ser refeito (o onboarding já trata
              thumbnail ausente/quebrado de forma graciosa, então isso nunca
              derruba a tela — só volta a mostrar o placeholder). `preview_url`
              continua `NULL`, mesma razão já registrada na sessão anterior.
              Nada disso foi aplicado ao projeto Supabase real. Próximo item
              real do roadmap principal segue sendo a Fase 5, ainda não
              iniciada — outros 4 templates também seguem sem confirmação.

[2026-09-17] — Usuário reportou mais um sintoma do mesmo card do onboarding:
              o "Aurea Joalheria" também não mostrava os selinhos de destaque
              (Aura Maison mostra "Luxo/Exclusivo/Premium"). Causa: os 3
              selinhos em `Onboarding.tsx` são renderizados por comparação
              exata de `layout_key` (`=== 'minimal'|'bold'|'premium'`), sem
              caso padrão — e o `layout_key` do novo template precisou ser
              `"aurea-joalheria"` (não podia reaproveitar `"premium"`, já
              usado pelo Aura Maison e com constraint UNIQUE). Corrigido
              adicionando o 4º caso (`layout_key === 'aurea-joalheria'`) com
              selinhos próprios — "Elegante/Sofisticado/Refinado", registro
              distinto do trio do Aura Maison, mesmo tom de luxo. `tsc
              --noEmit` limpo. Decisões tomadas: nenhuma nova. Pendências
              deixadas: nenhuma nova.

[2026-09-17] — Mais dois ajustes no mesmo card do onboarding, a pedido do
              usuário: (1) botão "Ver Preview" (olho) também não aparecia no
              Aurea Joalheria — causa: `preview_url` tinha ficado `NULL` de
              propósito na sessão anterior (loja de teste não era fixture
              permanente). Resolvido formalizando `techgadgets-brasil` como
              fixture permanente do `seed.sql` (loja+categoria+2 produtos+
              `store_theme_configs` com `themeId: "aurea-joalheria"`),
              reaproveitando owner/organização de "Loja B" — deliberadamente
              **fora** do cenário de isolamento Tenant A/B de `SEED_DATA.md`
              (esse continua sendo só loja-a/loja-b), cumpre só o mesmo papel
              que loja-a cumpre pro Aura Maison: destino do botão de preview.
              `templates.preview_url` atualizado pra `/store/techgadgets-brasil`
              (aplicado no `seed.sql` e também direto no ambiente local em uso,
              via REST/`service_role`, já que o resto dos dados dessa loja já
              existia lá desde a validação anterior). (2) Usuário notou que o
              card do Aurea Joalheria "parecia diferente" do Aura Maison — não
              era resíduo de bug específico do tema novo: todo card
              não-selecionado tem `border-transparent` (invisível), e só o
              Aura Maison aparecia com contorno porque é o primeiro retornado
              pela query sem `ORDER BY` em `Onboarding.tsx` (logo,
              pré-selecionado por padrão, ganhando o estilo de card
              selecionado). Corrigido na raiz, não só pro tema novo: trocado
              `border-transparent` por `border-border` (token neutro já
              existente) no estado não-selecionado — agora todo card tem um
              contorno sutil por padrão, e só o card realmente selecionado
              ganha o destaque colorido (`border-primary` + ring). Beneficia
              qualquer template futuro, não é um hack específico do Joalheria.
              `tsc --noEmit` limpo nas duas mudanças; preview_url testado
              (200 real em `/store/techgadgets-brasil`).
              Decisões tomadas: fixture de preview fica fora do cenário oficial
              de isolamento de `SEED_DATA.md` (documentado no comentário do
              seed, não silencioso); padronização de borda aplicada global
              (todos os cards), não só no card novo.
              Pendências deixadas: nenhuma nova além das já registradas
              (mesma fragilidade da signed URL do thumbnail entre resets;
              lacuna onboarding × Theme Contract desconectados; nada aplicado
              ao Supabase real). Fase 5 e os outros 4 templates seguem sem
              confirmação do usuário.

[2026-09-17] — Usuário reportou que a correção anterior (border-transparent
              → border-border) não resolveu de verdade: Aura Maison seguia
              com contorno visível fixo, Aurea Joalheria só ganhava contorno
              fraco no hover. Pedido explícito de investigar se era CSS
              aplicado diferente entre os cards ou algo hardcoded específico
              do Aura Maison, não hardcoded — confirmado por grep em todo
              `Onboarding.tsx` que não existe nenhum `if`/comparação por nome
              de tema fora dos 4 casos de selinho (já tratados na sessão
              anterior) e da seleção genérica por `t.id`. A causa real: o
              token `border-border` usado na correção anterior tem contraste
              quase nulo contra o fundo do card (`bg-secondary/50`) — no modo
              escuro `--border` e `--secondary` são **literalmente o mesmo
              valor HSL** (`240 3.7% 15.9%`) em `index.css`, ou seja, borda
              logicamente aplicada mas visualmente invisível; no modo claro a
              diferença de luminosidade é de só ~6 pontos, também quase
              imperceptível. Isso afeta os dois cards igualmente — o
              Aura Maison só "parecia" ter contorno fixo por vir
              pré-selecionado por padrão (primeiro item de uma query sem
              `ORDER BY`, não específico de nome/tema), ganhando o estilo de
              selecionado (`border-primary` sólido), não por ter CSS
              diferente. Corrigido trocando `border-border` por
              `border-muted-foreground/30` — token com contraste real contra
              o fundo nos dois temas (claro: 46% de luminosidade vs ~96% do
              fundo; escuro: 65% vs ~16%), então agora qualquer card
              não-selecionado mostra o mesmo contorno visível o tempo todo,
              independente de qual template é ou da ordem em que a query
              retorna. `tsc --noEmit` limpo.
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: nenhuma nova relacionada a isto. A
              assimetria de "qual card vem pré-selecionado por padrão"
              continua existindo (é esperado — algum card precisa vir
              selecionado inicialmente), mas agora só se manifesta como
              destaque de seleção (`border-primary`/ring), não mais como
              "esse card tem borda e o outro não". Fase 5 e os outros 4
              templates seguem sem confirmação do usuário.

[2026-09-17] — Usuário ainda via os dois cards diferentes depois do ajuste
              de contraste: o Aura Maison seguia parecendo "mais forte" que
              o Aurea Joalheria. A correção anterior tratou só o sintoma
              (contraste do estado não-selecionado); a causa raiz continuava
              lá — `fetchTemplates()` pré-selecionava `data[0].id` (primeiro
              template retornado, sem `ORDER BY`) automaticamente, então
              **sempre havia um card no estilo forte de "selecionado"**
              (`border-primary` sólido + ring + shadow + scale) mesmo sem
              nenhum clique do usuário. Como isso é independente de nome de
              tema (é sobre índice 0 da lista), corrigir só a cor do estado
              "não selecionado" nunca ia igualar os dois cards de verdade —
              um dos dois sempre ia estar no estado de destaque enquanto o
              outro não. Removida a pré-seleção automática: `formData.
              templateId` agora começa vazio, então nenhum card vem com
              destaque até o usuário clicar em um — os dois ficam
              genuinamente idênticos até a escolha ativa. Adicionada, de
              passagem, uma validação que não existia (bug latente exposto
              por essa mudança): o passo 1 já bloqueava avançar sem nome/slug,
              mas o passo 3 deixava avançar sem nenhum tema escolhido — com a
              pré-seleção automática isso nunca acontecia na prática, mas sem
              ela um usuário clicando "Próximo" batido poderia chegar no
              passo 4 com `templateId` vazio e `handleComplete` tentaria
              gravar `active_template_id: ""` (não é UUID válido, erro no
              insert). Corrigido com a mesma mensagem de padrão do passo 1:
              "Por favor, escolha um tema para a sua loja." `tsc --noEmit`
              limpo.
              Decisões tomadas: nenhuma nova.
              Pendências deixadas: nenhuma nova. Fase 5 e os outros 4
              templates seguem sem confirmação do usuário.

[2026-09-27] — Consolidação oficial do Checkpoint 96fdef9 e Auditoria Geral:
              (1) Arquitetura e Especificações: Adicionados 13 documentos de
              engenharia em docs/architecture/ cobrindo checkout, commerce engine,
              customer engine, design system, section engine, SEO/social, shipping,
              store engine, theme engine e theme registry.
              (2) Temas e Editor Visual (Fase 4): Formalizados os 5 temas oficiais
              (Base Theme, Minimal Clean, Aura Maison, Áurea Joalheria e Jô Perfumes)
              com registro dinâmico em ThemeRegistry.ts, tokens CSS injetados via
              themeTokens.ts e customizador visual completo com Live Preview em
              VisualStoreEditor.tsx.
              (3) Checkout e Gateway Mercado Pago (Fase 5): Implementação de checkout
              desacoplado com frete condicional (useShippingCalculator), botão de
              WhatsApp formatado (whatsapp.ts), 9 Edge Functions Supabase (create-order,
              mercadopago-connect, callback, connection-status, webhook com lock,
              cancel-order e refund-order com Claim/CAS) e 4 novas migrações SQL.
              (4) Validação Automatizada: 20 arquivos de teste Vitest com 95 testes
              aprovados (100% PASS local), incluindo suítes adversariais para gateway,
              reembolso, injeção de tokens e renderização DOM dos 5 temas.
              (5) Auditoria de Gaps: Registrado com rigor que, embora o código e
              os testes de contrato existam, a integração real contra a API do
              Mercado Pago, o recebimento de webhooks reais e o deploy de produção
              permanecem como pendências abertas da Fase 5.
              Decisões tomadas: Não considerar Fase 5 como [OK] até validação em
              sandbox/produção com gateway real; catalogar divergências documentais.
              Pendências deixadas: Prova de integração no sandbox do Mercado Pago;
              vínculo de customers em create-order; seed de plans no banco remoto;
              deploy inicial no AWS Amplify Hosting.
```

[2026-10-01] â€” MigraÃ§Ã£o CanÃ´nica para o Ecossistema e AdoÃ§Ã£o do Artefactho SDD Framework v1.0.0:
              (1) InstalaÃ§Ã£o CanÃ´nica: O projeto foi integrado como repositÃ³rio Git autÃ´nomo e independente em
              ARTEFACTHO â€” ECOSSISTEMA\13 â€” PROJETOS DE SOFTWARE\social_commerce_saas.
              (2) SincronizaÃ§Ã£o GitHub: RepositÃ³rio remoto https://github.com/Artefactho/social_commerce_saas
              100% sincronizado na branch main com commit de integraÃ§Ã£o da interface Mercado Pago.
              (3) AdoÃ§Ã£o do Framework SDD: IncorporaÃ§Ã£o oficial do Artefactho SDD Framework v1.0.0 (Tag v1.0.0,
              Commit 70caa06) com CONSTITUTION.md, regras de ambiguidade, gatilhos de pausa e skill adversarial.
              (4) VerificaÃ§Ã£o de Build e Testes: 
pm run build executado com sucesso e suÃ­te de testes Vitest
              aprovada sem regressÃµes no novo ambiente.
              (5) Estado do Projeto: Fases 0 a 4 concluÃ­das; Fase 5 (Checkout e Mercado Pago) em andamento aguardando
              validaÃ§Ã£o em sandbox real de pagamento.
              DecisÃµes tomadas: Manter o repositÃ³rio Git independente dentro de 13 â€” PROJETOS DE SOFTWARE.
              PrÃ³ximo passo: Continuidade do desenvolvimento da Fase 5 (testes em sandbox do Mercado Pago).
