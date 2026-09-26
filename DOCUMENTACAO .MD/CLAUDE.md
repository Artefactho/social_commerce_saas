# CLAUDE.md

Este arquivo é lido automaticamente pelo Claude Code no início de cada sessão.
Ele é a "memória de trabalho" do projeto — enxuto, prático, sempre atualizado.
O `SPEC_MASTER.md` continua sendo a fonte de verdade do **produto**; este
arquivo é a fonte de verdade de **como trabalhar no dia a dia**.

---

## 0. LEIA NESTA ORDEM, TODA SESSÃO

1. Este arquivo (`CLAUDE.md`).
2. `PROGRESS.md` — o que já foi feito, em que fase estamos, qual o próximo passo.
3. `/adr/` — decisões de arquitetura já tomadas (stack, banco, auth, etc). Nunca
   redecidir algo que já tem ADR aceito sem justificar por que está mudando.
4. `SPEC_MASTER.md` — consultar a seção específica da feature que for
   implementar. Não precisa reler o documento inteiro toda vez; use o índice.
5. `CRITERIOS_DE_ACEITE.md` — antes de marcar uma fase como concluída.

Se `PROGRESS.md` ainda estiver vazio/zerado, isso significa que o projeto
ainda não começou: siga primeiro a seção 79 do SPEC_MASTER (definir e
justificar arquitetura) antes de escrever qualquer código.

---

## 1. O QUE É O PROJETO (resumo de 30 segundos)

SaaS multi-tenant de criação de lojas sociais (catálogo, checkout, WhatsApp,
Pix). Cada lojista (organização) pode ter várias lojas. O SaaS cobra
assinatura; frete é regra de dentro da loja do lojista, não do SaaS.
Detalhes completos: `SPEC_MASTER.md`.

---

## 2. STACK ATUAL

> Preencher assim que a Fase de Arquitetura for concluída e o ADR-0001 for aceito.

```text
Frontend:  [definir via ADR]
Backend:   [definir via ADR]
Database:  [definir via ADR]
Auth:      [definir via ADR]
Storage:   [definir via ADR]
Deploy:    [definir via ADR]
```

Comandos (preencher junto com a stack):

```bash
# instalar dependências
[TBD]

# rodar em desenvolvimento
[TBD]

# rodar testes
[TBD]

# rodar lint / typecheck
[TBD]

# build de produção
[TBD]
```

**Enquanto esta seção estiver com `[TBD]`, não presumir nenhuma stack.**

---

## 3. REGRAS INEGOCIÁVEIS (resumo — detalhe completo no SPEC_MASTER)

Estas são as regras que, se violadas, exigem parar e corrigir antes de
continuar — não importa a pressa:

1. **Isolamento de tenant é sempre no backend/banco.** Nunca confiar em
   filtro do frontend. `organization_id`/`store_id` sempre validado no
   servidor antes de qualquer leitura/escrita (SPEC_MASTER §39, §43, §89).
2. **Frete é condicional por `product_type`.** Produto físico → frete;
   produto digital → nunca mostrar frete (§16.3).
3. **Nenhum dado sensível em log, export ou analytics sem necessidade**
   (LGPD, §38.1).
4. **Nenhuma decisão de stack/arquitetura nova sem registrar um ADR.**
5. **Nenhuma alteração destrutiva (drop de tabela, rewrite de módulo
   inteiro) sem commit anterior e confirmação explícita** (§80).
6. **Implementação incremental, por fases** (§81) — não implementar várias
   fases de uma vez sem validar a anterior.
7. **Todo teste de isolamento entre Tenant A e Tenant B deve dar DENIED,
   nunca 200 OK** (§71) — é o teste mais importante do projeto.

---

## 4. FLUXO DE TRABALHO POR SESSÃO

```text
Ler CLAUDE.md + PROGRESS.md + ADRs
        ↓
Identificar a fase/item atual (PROGRESS.md)
        ↓
Consultar a seção correspondente no SPEC_MASTER.md
        ↓
Implementar
        ↓
Rodar testes (incluindo teste de isolamento se aplicável)
        ↓
Validar contra CRITERIOS_DE_ACEITE.md da fase
        ↓
Atualizar PROGRESS.md
        ↓
Propor commit (nunca commitar automaticamente algo destrutivo sem confirmação)
```

---

## 5. REGRA DE AMBIGUIDADE — NÃO ASSUMIR, PERGUNTAR

Nem toda ambiguidade trava o trabalho. A regra é: **o impacto da ambiguidade
decide se você pergunta ou se você assume e documenta.**

### 5.1 Classifique a ambiguidade antes de agir

**Alto impacto → SEMPRE perguntar antes de prosseguir.** Isso inclui
qualquer ambiguidade que toque:

- isolamento entre tenants (quem pode ver o quê);
- dinheiro (valores, cobrança, reembolso, cálculo de frete/desconto);
- dados pessoais / LGPD (o que é coletado, retido, exportado, excluído);
- limites de plano não especificados numericamente na spec;
- qualquer coisa que, se errada, exigiria migration de dados pra corrigir
  depois.

**Baixo impacto → pode assumir, documentar e seguir.** Isso inclui:

- nome de variável/função, organização interna de pasta;
- detalhe visual não coberto pelo Theme Contract (ex: espaçamento exato);
- escolha entre duas bibliotecas equivalentes para um utilitário pequeno
  (não estrutural — algo que não merece ADR);
- ordem de implementação dentro da mesma fase, quando a spec não define.

### 5.2 Como documentar uma suposição de baixo impacto

Nunca assumir em silêncio. Toda suposição de baixo impacto deve ser
registrada explicitamente:

```text
ASSUMPTION: [o que foi assumido] — [por quê] — reversível: sim/não
```

Colocar essa linha no comentário do código relevante **e** na entrada da
sessão em `PROGRESS.md`. Isso permite revisar depois, em lote, todas as
suposições feitas sem precisar reler todo o código.

### 5.3 Como perguntar quando for alto impacto

Não perguntar de forma aberta ("como você quer isso?"). Sempre:

1. explicar o dilema em 1-2 frases;
2. apresentar 2-3 opções concretas com o trade-off de cada uma;
3. indicar qual opção você recomendaria, se tivesse que escolher;
4. esperar a resposta antes de implementar qualquer uma delas.

---

## 6. GATILHOS EXPLÍCITOS DE PAUSA PARA REVISÃO HUMANA

Estes gatilhos são diferentes da regra de ambiguidade acima: aqui a spec
pode estar perfeitamente clara, mas a ação em si é sensível o bastante para
exigir revisão humana antes de executar — mesmo com 100% de certeza técnica.

**Pare e espere confirmação explícita antes de:**

- [ ] Rodar qualquer comando destrutivo: `DROP`, `TRUNCATE`, `DELETE` sem
      `WHERE`, `rm -rf`, `git push --force`, remover migration já aplicada.
- [ ] Alterar ou substituir uma decisão registrada em ADR já aceito.
- [ ] Adicionar uma dependência nova de peso (ORM, framework, provider de
      auth/pagamento) que não estava prevista em nenhum ADR.
- [ ] Tocar em código de webhook/pagamento já em produção, ou em qualquer
      ambiente com dados reais de lojista.
- [ ] Fazer deploy em produção.
- [ ] Concluir uma fase inteira das 8 do §81 — apresentar o diagnóstico
      `[OK]/[PARTIAL]/[MISSING]/[PROBLEM]` (`CRITERIOS_DE_ACEITE.md`) e
      esperar sinal verde antes de iniciar a próxima fase.
- [ ] Um teste que antes passava começar a falhar (regressão) — parar e
      investigar antes de "consertar" mudando o teste.
- [ ] Uma alteração que toca mais de ~5 arquivos ou mais de um módulo do
      Commerce Core ao mesmo tempo — quebrar em passos menores e confirmar
      o primeiro antes do resto.
- [ ] Qualquer decisão que tenha custo financeiro recorrente (ex: escolher
      um serviço pago de terceiros).

**Não é gatilho de pausa** (pode seguir direto): criar/editar componente de
UI, escrever teste, ajustar estilo, corrigir bug já diagnosticado dentro do
escopo da fase atual, atualizar `PROGRESS.md`.

---

## 7. ARQUIVOS DO PROJETO

```text
SPEC_MASTER.md          → especificação completa do produto (fonte de verdade)
CLAUDE.md               → este arquivo (memória operacional)
PROGRESS.md             → estado atual, o que falta
CRITERIOS_DE_ACEITE.md  → checklist testável por fase
SEED_DATA.md            → cenário padrão de dados para testes/isolamento
/adr/                   → registro de decisões de arquitetura
```
