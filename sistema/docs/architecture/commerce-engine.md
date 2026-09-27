# Commerce Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Catálogo, filtros, motor de carrinho, preços, regras de frete e pedidos.

---

## 1. Abstração de Consulta de Produtos (`ProductQuery`)

Todas as listagens (Home, Categorias, Busca, Vitrines Especiais) utilizam o mesmo contrato:

```typescript
export interface ProductQuery {
  storeId: string;
  categorySlug?: string;
  searchTerm?: string;
  productType?: 'all' | 'physical' | 'digital';
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'bestsellers';
  cursor?: string;
  limit?: number;
}

export interface ProductQueryResult {
  items: Product[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  availableFilters: {
    categories: { slug: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}
```

---

## 2. Componente Unificado `ProductListing`

```text
ProductListing
├── FilterSidebar (ou Drawer mobile)
├── ActiveFilterBadges
├── SortDropdown
├── ProductGrid (responsivo 2 cols mobile / 3-4 cols desktop)
│    └── ProductCard (reutilizável)
├── EmptyResultsState
└── LoadMoreTrigger / Pagination
```

---

## 3. Cart Engine (Motor de Carrinho)

```typescript
export interface CartItem {
  id: string;            // UUID do item no carrinho
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  productType: 'physical' | 'digital';
  attributes?: Record<string, string>; // Tamanho, Cor, etc.
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
}
```

### Regras Inegociáveis do Carrinho:
1. **Isolamento por Loja:** O carrinho armazena `storeId`. Se o cliente tentar adicionar produto de outra loja, o sistema alerta e solicita limpeza do carrinho anterior.
2. **Frete Condicional:** Se `items.every(item => item.productType === 'digital')`, o `shippingTotal` é forçado a 0 e o passo de frete é omitido.
3. **Validação no Servidor:** O frontend envia apenas `{ productId, variantId, quantity, couponCode, shippingZip }`. O cálculo final de `grandTotal` é executado na Edge Function / Backend, impedindo fraude de preços.
