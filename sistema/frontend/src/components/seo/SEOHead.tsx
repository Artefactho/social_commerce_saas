import React, { useEffect } from "react";
import { ThemeProduct, StoreInfo } from "@/types/theme";

interface SEOHeadProps {
  store: StoreInfo;
  product?: ThemeProduct;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  store,
  product,
  title,
  description,
  image,
  url,
}) => {
  const pageTitle = product
    ? `${product.name} | ${store.name}`
    : title || `${store.name} - Loja Oficial`;

  const metaDesc = product
    ? product.description || `Compre ${product.name} por ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)} na ${store.name}.`
    : description || `Confira os produtos e lançamentos exclusivos da loja ${store.name}.`;

  const metaImage = product?.images[0] || image || store.logo_url || store.banner_url || "";
  const canonicalUrl = url || window.location.href;

  useEffect(() => {
    // 1. Update document title
    document.title = pageTitle;

    // 2. Helper to set/update meta tag
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        const parts = selector.replace(/[\[\]"]/g, "").split("=");
        if (parts.length === 2) {
          meta.setAttribute(parts[0], parts[1]);
          document.head.appendChild(meta);
        }
      }
      meta.setAttribute(attr, value);
    };

    setMetaTag('meta[name="description"]', "content", metaDesc);
    setMetaTag('meta[property="og:title"]', "content", pageTitle);
    setMetaTag('meta[property="og:description"]', "content", metaDesc);
    setMetaTag('meta[property="og:image"]', "content", metaImage);
    setMetaTag('meta[property="og:url"]', "content", canonicalUrl);
    setMetaTag('meta[property="og:type"]', "content", product ? "product" : "website");
    setMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "content", pageTitle);
    setMetaTag('meta[name="twitter:description"]', "content", metaDesc);
    setMetaTag('meta[name="twitter:image"]', "content", metaImage);

    // 3. Schema.org JSON-LD Structured Data
    if (product) {
      let script = document.getElementById("product-jsonld") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "product-jsonld";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.text = JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        image: product.images,
        description: product.description,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: product.price,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: store.name,
          },
        },
      });
    }
  }, [pageTitle, metaDesc, metaImage, canonicalUrl, product, store.name]);

  return null;
};
