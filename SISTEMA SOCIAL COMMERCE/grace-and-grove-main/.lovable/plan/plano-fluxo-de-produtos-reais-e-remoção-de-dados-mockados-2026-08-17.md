# Plano: Fluxo de Produtos Reais e Remoção de Dados Mockados

O objetivo é remover todos os produtos fictícios e garantir que o sistema utilize apenas os dados reais vindos do banco de dados (Supabase).

## Análise do Arquivo `src/data/products.ts`
O arquivo `src/data/products.ts` contém os seguintes dados fictícios:
- **Coleções**: Lighting, Ceramics, Furniture, Textiles, Objects, Seasonal, New Arrivals, Gifts.
- **Produtos**: Arc Pendant, Orb Lamp, Sculptural Vessel, Serving Bowl, Harvest Table, Lounge Chair, Linen Throw, Wool Cushion, Bud Vase, Candleholder Set, Winter Candle, Marble Tray, Gift Box.

**Uso Atual:**
- `src/components/Header.tsx`: Usa o array `collections` para o menu.
- `src/components/CollectionCard.tsx`: Usa a interface `Collection`.
- `src/hooks/useCart.ts` e `src/hooks/useWishlist.ts`: Usam a interface `Product`.

**Decisão:** Manter o arquivo apenas para as interfaces (`export interface`). Remover todos os arrays de dados e funções mockadas. O `Header.tsx` será limpo (remoção do menu "Collections" fictício). Como a Landing Page e a PublicStore possuem navegação própria ou dinâmica, o impacto visual será nulo nas páginas principais.



## Etapas de Implementação

### 1. Limpeza de Dados e Tipagem
- **`src/data/products.ts`**: Remover os arrays `collections` e `products` e as funções que os utilizam. Manter apenas as `export interface`.
- **`src/pages/Checkout.tsx`**: Remover o estado inicial mockado (`Camiseta Premium Algodão`, `Calça Jeans Slim Fit`) e integrar com o hook `useCart`.

### 2. Integração do Carrinho Real
- **`src/pages/PublicStore.tsx`**:
    - Alterar a ação de clique no produto para usar `addItem` do `useCart`.
    - Garantir que o objeto passado para o carrinho contenha os dados reais (ID, Nome, Preço, Imagem assinada).
- **`src/pages/Checkout.tsx`**:
    - Substituir o `useState` local pelo `useCart`.
    - Atualizar as funções `updateQuantity` e `removeItem` para chamarem o hook global.

### 3. Ajustes de Interface
- **`src/components/Header.tsx`**: Como o menu de coleções usa dados mockados, vamos desativá-lo temporariamente ou torná-lo opcional, já que a estrutura de "Categorias" no banco de dados para o SaaS é simplificada (enum na tabela `stores`).

## Verificação
1. Adicionar 3 produtos reais no Dashboard.
2. Ir para a Loja Pública, clicar em cada um e verificar se aparecem no carrinho/checkout com nome, preço e foto corretos.
3. Confirmar que não há mais vestígios de "Camiseta Premium Algodão" ou "Arc Pendant Light".
