# Shipping Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Cálculo unificado de frete, opções de entrega, retirada no local e prazos estimados.

---

## 1. Contrato de Cálculo de Frete

```typescript
export interface ShippingCalculationInput {
  storeId: string;
  destinationZip: string;
  items: {
    productId: string;
    quantity: number;
    weightKg?: number;
    dimensionsCm?: { length: number; width: number; height: number };
    productType: 'physical' | 'digital';
  }[];
}

export interface ShippingOption {
  id: string;                      // 'sedex' | 'pac' | 'motoboy' | 'pickup' | 'store_fixed'
  name: string;                    // 'SEDEX', 'Entrega Expressa', 'Retirada na Loja'
  carrier: string;                 // 'Correios', 'Melhor Envio', 'Loggi', 'Próprio'
  price: number;
  estimatedDeliveryDays: number;
  estimatedDeliveryText: string;   // 'Receba em até 3 dias úteis'
  isPickup: boolean;
}
```

---

## 2. Regras Essenciais
1. **Produtos Digitais:** Se todos os itens do carrinho forem `productType === 'digital'`, a função de cálculo retorna automaticamente `[ { id: 'digital_free', price: 0, estimatedDeliveryDays: 0, isPickup: false } ]`.
2. **Reutilização Única:** O mesmo hook e serviço `useShippingCalculator` é utilizado:
   - Na página de detalhe do produto (PDP) para simular frete;
   - No Drawer / Carrinho;
   - No Checkout.
