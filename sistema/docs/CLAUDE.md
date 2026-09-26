# CLAUDE.md

Este arquivo é lido automaticamente pelo Claude Code no início de cada sessão. Ele é a
"memória de trabalho" do projeto — enxuto, prático, sempre atualizado. Os três
documentos de produto (`VISAO_E_MODELO_DE_NEGOCIO.md`, `ARQUITETURA_TECNICA.md`,
`ROADMAP_DE_EXECUCAO.md`) continuam sendo a fonte de verdade do **produto e da
arquitetura**; este arquivo é a fonte de verdade de **como trabalhar no dia a dia**.

---

## 0. LEIA NESTA ORDEM, TODA SESSÃO

1. Este arquivo (`CLAUDE.md`).
2. `PROGRESS.md` — o que já foi feito, em que fase estamos, qual o próximo passo.
3. `adr/` — decisões de arquitetura já tomadas (stack, banco, auth, storage,
   pagamentos, deploy). Nunca redecidir algo que já tem ADR aceito sem justificar por
   que está mudando.
4. `ARQUITETURA_TECNICA.md` e `VISAO_E_MODELO_DE_NEGOCIO.md` — consultar a seção
   específica da feature que for implementar. Não precisa reler os documentos
   inteiros toda vez.
5. `skills/theme-contract.md` — antes de tocar em qualquer código de tema ou de
   Store Configuration. Ver também `skills/` de forma geral, antes de implementar
   um padrão técnico reutilizável já coberto por alguma skill (ex.: upload/exibição
   de arquivo — `skills/avatar-e-arquivo.md`).
6. `ROADMAP_DE_EXECUCAO.md` — critério de aceite da fase atual, antes de marcar algo
   como concluído.

---

## 1. O QUE É O PROJETO (resumo de 30 segundos)

SaaS multi-tenant de criação de lojas sociais (catálogo, checkout, WhatsApp, Pix).
Cada lojista (organização) pode ter várias lojas. O SaaS cobra assinatura; frete é
regra de dentro da loja do lojista, nunca do SaaS. Já existe um código funcional
(reaproveitado, não construído do zero) e uma implementação de referência do tema
oficial (Aura Maison). Detalhes completos: `VISAO_E_MODELO_DE_NEGOCIO.md`.

---

## 2. STACK ATUAL

Decidida nos ADRs 0001-0006 (`adr/`), detalhada em `ARQUITETURA_TECNICA.md`:

```text
Frontend:  React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + Zustand
           + TanStack Query + React Router v6
Backend:   Supabase (Postgres + RLS + PostgREST + GoTrue + Storage)
           + Edge Functions (Deno) para lógica privilegiada
Database:  Postgres via Supabase, isolamento multi-tenant por RLS (ADR-0002)
Auth:      Supabase Auth / GoTrue (ADR-0003)
Storage:   Supabase Storage, bucket `products` com RLS por pasta (ADR-0004)
Pagamento: Mercado Pago (Pix + Connect/OAuth) via PaymentService adapter (ADR-0005)
Deploy:    AWS Amplify Hosting (frontend) + Supabase Cloud (backend) no MVP;
           self-host AWS (EC2/ECS+RDS, sa-east-1) a partir da Fase 8 (ADR-0006)
```

Comandos (a partir de `/sistema/frontend`):

```bash
# instalar dependências
npm install

# rodar em desenvolvimento
npm run dev

# rodar testes
npm run test

# rodar lint / typecheck
npm run lint

# build de produção
npm run build

# banco local (Supabase CLI)
supabase start
supabase db reset
```

---

## 3. REGRAS INEGOCIÁVEIS (resumo — detalhe completo em `ARQUITETURA_TECNICA.md`)

Regras que, se violadas, exigem parar e corrigir antes de continuar — não importa a
pressa:

1. **Isolamento de tenant é sempre no backend/banco (RLS).** Nunca confiar em filtro
   do frontend. `organization_id`/`store_id` sempre validado no servidor antes de
   qualquer leitura/escrita.
2. **Frete é condicional por `product_type`.** Produto físico → frete; produto
   digital → nunca mostrar frete.
3. **Theme nunca implementa lógica de negócio.** Nenhum componente de tema acessa
   banco, autentica usuário ou calcula frete/estoque diretamente — sempre via
   `ThemeRendererProps`/`ThemeActions` (`skills/theme-contract.md`).
4. **Nenhum dado sensível em log, export ou analytics sem necessidade** (LGPD).
5. **Nenhuma decisão de stack/arquitetura nova sem registrar um ADR.**
6. **Nenhuma alteração destrutiva (drop de tabela, rewrite de módulo inteiro) sem
   commit anterior e confirmação explícita.**
7. **Nunca aplicar uma migration squashada ou reestruturada num projeto Supabase
   real sem antes validá-la localmente** (`supabase start` ou projeto descartável) e
   confirmar explicitamente antes de aplicar em produção.
8. **Implementação incremental, por fases** (`ROADMAP_DE_EXECUCAO.md`) — não
   implementar várias fases de uma vez sem validar a anterior.
9. **Todo teste de isolamento entre Tenant A e Tenant B deve dar DENIED, nunca
   200 OK** — é o teste mais importante do projeto.

---

## 4. FLUXO DE TRABALHO POR SESSÃO

```text
Ler CLAUDE.md + PROGRESS.md + ADRs
        ↓
Identificar a fase/item atual (PROGRESS.md)
        ↓
Consultar a seção correspondente em ARQUITETURA_TECNICA.md / VISAO_E_MODELO_DE_NEGOCIO.md
        ↓
Implementar
        ↓
Rodar testes (incluindo teste de isolamento se aplicável)
        ↓
Validar contra o critério de aceite da fase em ROADMAP_DE_EXECUCAO.md
        ↓
Atualizar PROGRESS.md
        ↓
Propor commit (nunca commitar automaticamente algo destrutivo sem confirmação)
```

Além da atualização de `PROGRESS.md` ao final da sessão inteira (último passo do
fluxo acima), registre um handoff curto **também ao concluir qualquer fase ou
subfase** (não só no fim da sessão): o que foi entregue, estado atual, o que vem a
seguir, qualquer pergunta em aberto. Isso permite que a sessão seja interrompida a
qualquer momento — inclusive no meio de uma fase — sem perder o fio (já aconteceu
duas vezes neste projeto: pausa por falta de memória e reinício inesperado do PC,
ambos registrados no histórico de `PROGRESS.md`).

---

## 5. REGRA DE AMBIGUIDADE — NÃO ASSUMIR, PERGUNTAR

Nem toda ambiguidade trava o trabalho. A regra é: **o impacto da ambiguidade decide se
você pergunta ou se você assume e documenta.**

### 5.1 Classifique a ambiguidade antes de agir

**Alto impacto → SEMPRE perguntar antes de prosseguir.** Isso inclui qualquer
ambiguidade que toque:

- isolamento entre tenants (quem pode ver o quê);
- dinheiro (valores, cobrança, reembolso, cálculo de frete/desconto);
- dados pessoais / LGPD (o que é coletado, retido, exportado, excluído);
- limites de plano não especificados numericamente na spec;
- qual pasta/ambiente é a "real" quando houver mais de uma cópia do projeto;
- qualquer coisa que, se errada, exigiria migration de dados pra corrigir depois.

**Baixo impacto → pode assumir, documentar e seguir.** Isso inclui:

- nome de variável/função, organização interna de pasta;
- detalhe visual não coberto pelo `skills/theme-contract.md` (ex: espaçamento exato);
- escolha entre duas bibliotecas equivalentes para um utilitário pequeno (não
  estrutural — algo que não merece ADR);
- ordem de implementação dentro da mesma fase, quando a spec não define.

### 5.2 Como documentar uma suposição de baixo impacto

Nunca assumir em silêncio. Toda suposição de baixo impacto deve ser registrada
explicitamente:

```text
ASSUMPTION: [o que foi assumido] — [por quê] — reversível: sim/não
```

Colocar essa linha no comentário do código relevante **e** na entrada da sessão em
`PROGRESS.md`.

### 5.3 Como perguntar quando for alto impacto

Não perguntar de forma aberta ("como você quer isso?"). Sempre:

1. explicar o dilema em 1-2 frases;
2. apresentar 2-3 opções concretas com o trade-off de cada uma;
3. indicar qual opção você recomendaria, se tivesse que escolher;
4. esperar a resposta antes de implementar qualquer uma delas.

### 5.4 Princípio da complexidade justificada

Antes de aceitar qualquer proposta de arquitetura ou solução — sua própria ou vinda
do usuário — pergunte explicitamente: essa complexidade resolve uma necessidade
real e atual do projeto, ou é complexidade antecipada, sem necessidade comprovada
ainda?

Quando for a segunda opção, simplifique conscientemente e registre a decisão: se
for uma escolha estrutural (mexe em stack, modelo de dados, ou algo que já tem
ADR), abra um ADR curto (mesmo formato dos 6 existentes em `adr/`); se for uma
escolha pontual de código, documente como uma linha `ASSUMPTION` (regra 5.2 acima).
Simplificar não é "cortar caminho às escondidas" — é escolha deliberada,
documentada e revisável quando o projeto crescer e a necessidade comprovada
aparecer.

Exemplo já aplicado neste projeto (não hipotético): a Fase 4.1 confirmou por
auditoria que o tema Aura Maison já nascera genericizado desde a fatia essencial da
Fase 4 — a decisão de não reescrever nada e reportar isso com transparência, em vez
de forçar um retrabalho especulativo "porque o levantamento original pedia", é
exatamente esse princípio em ação.

---

## 6. GATILHOS EXPLÍCITOS DE PAUSA PARA REVISÃO HUMANA

Estes gatilhos são diferentes da regra de ambiguidade acima: aqui a spec pode estar
perfeitamente clara, mas a ação em si é sensível o bastante para exigir revisão
humana antes de executar — mesmo com 100% de certeza técnica.

**Pare e espere confirmação explícita antes de:**

- [ ] Rodar qualquer comando destrutivo: `DROP`, `TRUNCATE`, `DELETE` sem `WHERE`,
      `rm -rf`, `git push --force`, remover migration já aplicada.
- [ ] Aplicar uma migration squashada/reestruturada em qualquer projeto Supabase
      real (só depois de validada localmente, ver regra #7 da seção 3).
- [ ] Alterar ou substituir uma decisão registrada em ADR já aceito.
- [ ] Adicionar uma dependência nova de peso (ORM, framework, provider de
      auth/pagamento) que não estava prevista em nenhum ADR.
- [ ] Tocar em código de webhook/pagamento já em produção, ou em qualquer ambiente
      com dados reais de lojista.
- [ ] Fazer deploy em produção, ou fazer upgrade de um serviço de tier
      gratuito/pago (ex: Supabase Cloud FREE → Pro) fora do momento previsto no
      roadmap (Fase 6).
- [ ] Concluir uma fase inteira do `ROADMAP_DE_EXECUCAO.md` — apresentar o
      diagnóstico `[OK]/[PARTIAL]/[MISSING]/[PROBLEM]` (critério detalhado em
      `CRITERIOS_DE_ACEITE.md`, seção "Regra de conclusão de fase") e esperar sinal
      verde antes de iniciar a próxima fase.
- [ ] Um teste que antes passava começar a falhar (regressão) — parar e investigar
      antes de "consertar" mudando o teste.
- [ ] Uma alteração que toca mais de ~5 arquivos ou mais de um módulo do Commerce
      Core ao mesmo tempo — quebrar em passos menores e confirmar o primeiro antes do
      resto.
- [ ] Qualquer decisão que tenha custo financeiro recorrente (ex: escolher um
      serviço pago de terceiros).
- [ ] Apagar ou sobrescrever qualquer coisa fora de `/sistema` (as pastas históricas
      `DOCUMENTACAO .MD` e `SISTEMA SOCIAL COMMERCE` são preservadas intactas).

**Não é gatilho de pausa** (pode seguir direto): criar/editar componente de UI,
escrever teste, ajustar estilo, corrigir bug já diagnosticado dentro do escopo da
fase atual, atualizar `PROGRESS.md`.

---

## 7. ARQUIVOS DO PROJETO

```text
VISAO_E_MODELO_DE_NEGOCIO.md → o quê e para quem (fonte de verdade de produto)
ARQUITETURA_TECNICA.md       → como (stack, isolamento, modelo de dados, Theme Engine)
ROADMAP_DE_EXECUCAO.md       → ordem de entrega e critério de aceite por fase
CLAUDE.md                    → este arquivo (memória operacional)
PROGRESS.md                  → estado atual, o que falta
CRITERIOS_DE_ACEITE.md       → detalhamento testável complementar ao roadmap
SEED_DATA.md                 → cenário padrão de dados para testes/isolamento
adr/                         → registro de decisões de arquitetura (0001-0006)
skills/                      → padrões técnicos reutilizáveis entre features (ex.:
                                theme-contract.md, avatar-e-arquivo.md)
```

### 7.1 Quando criar uma skill nova em `skills/`

Crie um arquivo novo em `skills/` quando o padrão é **reutilizável entre features**
(mais de uma tela/fluxo vai repetir a mesma decisão técnica) e é detalhado o
suficiente para atrapalhar a leitura corrida de `ARQUITETURA_TECNICA.md` se ficasse
lá dentro — como já é o caso do Theme Contract, que sempre foi um documento à parte
por esse mesmo motivo. Se for uma decisão específica de uma única feature, sem
reuso, documente inline (`ARQUITETURA_TECNICA.md` ou uma linha `ASSUMPTION` no
próprio código) — não crie skill para algo usado uma vez só.
