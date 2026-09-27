# Store Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Roteamento, estados da loja, layouts e páginas públicas da loja.

---

## 1. Estados de Disponibilidade da Loja (`StoreAvailability`)

Uma loja pode estar em um dos 4 estados operacionais:

```typescript
export type StoreAvailability = 
  | 'ACTIVE'        // Loja aberta ao público e indexável
  | 'COMING_SOON'   // Página de "Em breve" com captura de e-mail / WhatsApp
  | 'MAINTENANCE'   // Página de manutenção temporária
  | 'PRIVATE';      // Loja protegida por senha de acesso (B2B ou VIP)
```

### Comportamento por Estado:
- **ACTIVE:** Renderização normal do catálogo e checkout.
- **COMING_SOON:** Bloqueia catálogo; exibe hero com contador, redes sociais e formulário de lista de espera.
- **MAINTENANCE:** Exibe aviso visual amigável sem permitir fechamento de novos pedidos.
- **PRIVATE:** Exibe modal ou tela de bloqueio exigindo PIN/Senha cadastrada nas configurações da loja.

---

## 2. Estrutura de Páginas da Loja

```text
/store/:slug                  → Home da Loja (renderizada pelo Section Engine)
/store/:slug/produtos         → Catálogo Completo (ProductListing com filtros e busca)
/store/:slug/categoria/:cat   → Listagem por Categoria (reutiliza ProductListing)
/store/:slug/p/:productSlug   → Página de Detalhe do Produto (PDP)
/store/:slug/sobre            → Página Institucional / Sobre a Loja
/store/:slug/contato          → Página de Contato / Links Sociais
/store/:slug/carrinho         → Carrinho em Página Completa (CartPage)
/store/:slug/checkout         → Checkout Seguro
/store/:slug/pedido/:orderId  → Status e Rastreamento do Pedido
```

---

## 3. Composição Estrutural da Loja (`StoreLayout`)

```tsx
export const StoreLayout: React.FC<StoreLayoutProps> = ({ children, store, themeConfig }) => {
  return (
    <ThemeProvider config={themeConfig}>
      <div className="store-canvas min-h-screen flex flex-col bg-[var(--theme-bg)] text-[var(--theme-text)]">
        <StoreHeader store={store} />
        <main className="flex-1">
          {children}
        </main>
        <StoreFooter store={store} />
        <CartDrawer />
        <QuickShopModal />
      </div>
    </ThemeProvider>
  );
};
```
