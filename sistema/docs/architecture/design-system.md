# Design System — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Biblioteca centralizada de componentes atômicos reutilizáveis.

---

## 1. Inventário de Componentes Atômicos

```text
src/components/ui/
├── Button
├── Input
├── Select
├── FormField
├── Checkbox / RadioGroup
├── Card
├── Modal / Dialog
├── Drawer
├── Toast / Sonner
├── Badge
├── Skeleton
├── EmptyState
├── Avatar
└── Tabs
```

---

## 2. Inventário de Componentes de Domínio Reutilizáveis

```text
src/components/commerce/
├── ProductCard              // Utilizado na Home, Categoria, Busca e Relacionados
├── ProductGrid              // Grade responsiva com skeleton de loading
├── ProductBadge             // Badges de Promoção, Lançamento, Esgotado
├── QuickShopModal           // Compra rápida / Seleção de variação
├── CartDrawer               // Drawer lateral de carrinho
├── CartItemRow              // Linha de produto no carrinho
├── QuantitySelector         // Seletor de quantidade (+ / -) com debounce
├── ShippingCalculator       // Calculadora de frete por CEP
├── CouponInput              // Campo de aplicação e validação de cupom
└── PriceDisplay             // Exibição formatada (Preço De / Por + Parcelamento)
```
