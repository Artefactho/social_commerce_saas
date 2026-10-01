# Skill — Auditoria de Integração Real & Validação Adversarial

## Quando isso se aplica

Quando uma fase, funcionalidade ou requisito depender da **composição de múltiplos componentes ou dependências reais** (ex.: rotas HTTP conectadas a serviços, workers consumindo filas, persistência em banco de dados, concorrência, comunicação com APIs externas, variáveis de ambiente ou instâncias/singletons compartilhados).

Se o requisito for puramente isolado (um algoritmo puro, uma função matemática, formatação simples de texto), testes unitários com mocks são suficientes e esta skill não precisa ser aprofundada — use o nível de evidência proporcional ao risco.

---

## Princípios Fundamentais

> **Teste verde comprova o comportamento que foi exercitado; não comprova automaticamente que o sistema real está correto nem que está conectado da forma exigida pelo requisito.**

> **Não aceite "existe um teste" ou "todos os testes passaram" como prova suficiente.**

> **Postura Adversarial:** Antes de aceitar `[OK]`, a auditoria deve partir de cada requisito e procurar ativamente como a implementação poderia estar errada mesmo com testes verdes.

---

## Fluxo Obrigatório de Auditoria Adversarial

Para cada requisito relevante da fase, execute sistematicamente o ciclo:

```
REQUISITO
→ MODOS DE FALHA
→ EVIDÊNCIA NECESSÁRIA
→ O TESTE CONSEGUIRIA DETECTAR A FALHA?
→ A INFRAESTRUTURA REAL É NECESSÁRIA?
→ RESULTADO
```

### Regras do Fluxo:

1. **Identificar Modos de Falha:** Mapear as principais formas concretas pelas quais o requisito poderia falhar no mundo real (ex.: concorrência sob isolamento do banco, mock residual em singleton de produção, perda de raw body/headers, timeout travando socket, regressão de estado).
2. **Determinar a Evidência Necessária:** Definir qual evidência ou inspeção física seria capaz de detectar cada falha identificada.
3. **Verificar Efetividade do Teste:** Verificar se os testes existentes realmente ficariam vermelhos diante da implementação incorreta correspondente.
4. **Auditar Mocks:** Verificar se mocks estão escondendo integração, concorrência, persistência, configuração, wiring ou comportamento externo.
5. **Exigir Infraestrutura Real:** Quando a falha depender de infraestrutura real (PostgreSQL, locks, transações, filesystem, rede), exigir evidência executada nessa infraestrutura real.
6. **Classificar o Resultado:** Se uma falha relevante não puder ser detectada pela evidência existente, o resultado **NÃO pode ser `[OK]`** — classifique obrigatoriamente como `[PARCIAL]`, `[FALTANDO]` ou `[PROBLEMA]`.

---

## O que Auditar (Guia de Verificação Estrutural)

### 1. Caminho Real de Execução
- Trace o fluxo de ponta a ponta: da entrada real (rota HTTP, evento, CLI, worker) até o ponto final de entrega.
- Não audite apenas a classe ou módulo isolado; confirme que o fluxo de produção executa o caminho pretendido.

### 2. Wiring e Composição
- **Instanciação e Injeção:** Verifique como o componente é instanciado na inicialização da aplicação (`server`, `app`, bootstrap, contêiner de DI).
- **Singletons e Instâncias Globais:** Confirme que o singleton ou serviço consumido pelas rotas/workers é a implementação real e não um mock residual de desenvolvimento ou teste.
- **Caminhos Alternativos:** Procure atalhos, fallbacks silenciosos ou mocks hardcoded que possam contornar a integração esperada.

### 3. Configuração e Variáveis de Ambiente
- Verifique se as variáveis de ambiente e arquivos de configuração são de fato consumidos pelo caminho real de execução.
- Não assuma que uma configuração funciona apenas porque ela está declarada no schema ou no `.env.example`.

### 4. Dependências Reais e Infraestrutura
- Onde houver persistência (banco de dados), transações, filas, concorrência, filesystem ou APIs externas, avalie o comportamento com a infraestrutura real.
- Verifique timeouts de rede, constraints de integridade, bloqueios de concorrência (`FOR UPDATE`, isolamento) e tratamento de erros de conexão.

### 5. Efetividade Real dos Testes
- Pergunte sempre: **"O que este teste realmente comprova e o que ele oculta?"**
- Identifique se mocks de dependências estão mascarando erros de protocolo, formato de payload, concorrência no banco ou falha de amarração.

---

## Regra de Diagnóstico

- Se a integração real, o wiring ou a ausência de falhas **não puderem ser comprovados**, o diagnóstico **NÃO pode ser `[OK]`**.
- Classifique obrigatoriamente a fase/item como:
  - `[PARCIAL]`: Implementação existe, mas falta comprovação do wiring, concorrência, persistência ou comportamento em ambiente integrado.
  - `[FALTANDO]`: Amarração ou dependência real prevista na especificação não foi conectada.
  - `[PROBLEMA]`: Falha, mock indevido em produção, travamento ou regressão identificada no caminho real.
- **Ciclo Obrigatório:** Corrigir a integração → retestar → reauditar antes de emitir o diagnóstico `[OK]`.
