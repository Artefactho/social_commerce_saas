# Relatório Técnico: Estado Atual do SaaS Commerce vs Fluxo Principal

Este relatório avalia a implementação atual do projeto em relação ao fluxo principal definido.

## 1. Lojista (Vendedor)

### Criar conta
- **Status:** **Implementado**
- **Detalhes:** Página `/login` e `/signup` (Auth.tsx) utiliza Supabase Auth real para cadastro e login.

### Nome da loja, Slug e Categoria
- **Status:** **Implementado**
- **Detalhes:** Fluxo de `/onboarding` (Onboarding.tsx) coleta nome, gera slug automático (editável) e categoria, salvando na tabela `stores`.

### Escolher template visualmente (thumbnail + preview reais)
- **Status:** **Implementado**
- **Detalhes:** No passo 3 do onboarding, o usuário escolhe entre templates (Minimal, Bold, Premium) com thumbnails reais vindos do banco de dados e botão de preview.

### Criar loja
- **Status:** **Implementado**
- **Detalhes:** Ao finalizar o onboarding, os dados são persistidos no Lovable Cloud (Supabase) e o usuário é redirecionado ao Dashboard.

### Dashboard
- **Status:** **Implementado**
- **Detalhes:** Painel funcional (`/dashboard`) com estatísticas (mockadas), gerenciamento de produtos e troca de templates em tempo real.

### Adicionar produtos
- **Status:** **Implementado**
- **Detalhes:** CRUD completo de produtos via `ProductModal`. Inclui upload de imagens para Storage privado com geração automática de Signed URLs de longa duração para exibição.

### Publicar
- **Status:** **Implementado (Automático)**
- **Detalhes:** A loja fica ativa assim que criada em `/store/:slug`.

### Configurar recebimento (PIX/gateway)
- **Status:** **Pendente / Mockado**
- **Detalhes:** A interface de Checkout (`/checkout`) mostra opções de PIX e Cartão, mas não há integração real com gateways de pagamento (Stripe/Mercado Pago) nem configuração de chaves pelo lojista ainda.

---

## 2. Cliente Final (Comprador)

### Acessa /store/:slug
- **Status:** **Implementado**
- **Detalhes:** Rota dinâmica funcional que renderiza a loja específica com base no slug.

### Vê a loja com o template real do lojista e produtos reais
- **Status:** **Implementado**
- **Detalhes:** `PublicStore.tsx` busca o template ativo e os produtos filtrados por `store_id` e `status='Ativo'`. As imagens carregam via Signed URLs para visitantes anônimos.

### Adiciona ao carrinho
- **Status:** **Parcialmente Implementado (Mockado no Checkout)**
- **Detalhes:** O botão "Explorar Agora" e a navegação estão lá, mas a lógica de estado global de carrinho (Redux/Zustand/Context) para persistir itens entre a loja e o checkout ainda utiliza dados estáticos no componente `Checkout.tsx`.

### Checkout
- **Status:** **Implementado (Interface)**
- **Detalhes:** Fluxo de 3 etapas (Carrinho -> Entrega -> Pagamento) funcional na UI.

### Paga via PIX/gateway configurado
- **Status:** **Mockado**
- **Detalhes:** O fluxo termina em uma tela de sucesso simulada. Não há processamento real de transação vinculado à conta do lojista.

### Pedido registrado, vinculado só àquela loja
- **Status:** **Pendente**
- **Detalhes:** A tabela `orders` existe no banco, mas o fechamento do checkout ainda não insere registros reais vinculados ao `store_id`.

---

## 3. Ciclo de Assinatura (Paralelo)

### Trial / Planos / Cobrança recorrente
- **Status:** **Pendente**
- **Detalhes:** A infraestrutura para planos e bloqueio de loja por expiração de trial ainda não foi iniciada.

---

## Conclusão e Próximos Passos Sugeridos

O projeto avançou significativamente nas camadas de **Identidade, Autenticação, Onboarding e Catálogo de Produtos**. O "Coração" do SaaS multi-tenant está batendo.

**Recomendações para fechar o ciclo:**
1. **Carrinho Real:** Integrar a `PublicStore` com o `Checkout` usando um hook de carrinho persistente.
2. **Registro de Pedidos:** Fazer o botão "Finalizar Compra" salvar dados reais na tabela `orders`.
3. **Configuração de Pagamento:** Criar uma aba no Dashboard para o lojista inserir seus dados de recebimento (ex: chave PIX ou conta Stripe).
4. **Infra de Assinatura:** Implementar a lógica de `plan_status` na tabela `stores` para controle de acesso.
