# SEO & Social Commerce — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Geração de tags OpenGraph, Twitter Cards, Schema.org (JSON-LD), deep links para redes sociais e integração com WhatsApp.

---

## 1. Otimização para Social Commerce

Como o tráfego do SaaS provém primariamente de Instagram, TikTok, WhatsApp e links compartilhados, as seguintes diretrizes são obrigatórias:

1. **Deep Links e URLs Estáveis:**
   - `/store/:slug/p/:productSlug`
   - Parâmetros UTM preservados durante toda a navegação e salvos no pedido para atribuição de vendas.
2. **Botão de Compra Direta no WhatsApp:**
   - Permite enviar o carrinho montado ou produto direto para o WhatsApp do lojista:
   `https://wa.me/5511999999999?text=Olá! Quero pedir o produto *Perfume X* (Qtd: 1). Total: R$ 189,90. Link: https://...`
3. **OpenGraph & Preview Dinâmico:**
   - Cada produto gera metatags com foto em alta resolução, preço e disponibilidade para gerar cards ricos no WhatsApp e Instagram DMs.

---

## 2. Schema.org JSON-LD (Rich Snippets)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Perfume Elegance 100ml",
  "image": ["https://.../perfume.jpg"],
  "description": "Fragrância importada marcante.",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "BRL",
    "price": "189.90",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Jô Perfumes"
    }
  }
}
</script>
```
