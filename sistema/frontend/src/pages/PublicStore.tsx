import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProduct, ThemeCategory, StoreInfo, StoreSection, ThemeCustomConfig } from "@/types/theme";
import { resolveThemeComponent, mergeThemeConfig } from "@/features/theme/ThemeRegistry";
import { buildThemeCssVariables } from "@/features/theme/themeTokens";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80";

const DEMO_STORES: Record<string, any> = {
  "demo-base-theme": {
    store: {
      id: "demo-base-theme",
      name: "Urban Style Base",
      slug: "demo-base-theme",
      logo_url: null,
      banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
      whatsapp: "5511999999999",
    },
    themeId: "base-theme",
    categories: [
      { id: "c1", name: "Lançamentos" },
      { id: "c2", name: "Moda Casual" },
      { id: "c3", name: "Calçados" },
      { id: "c4", name: "Acessórios" },
    ],
    products: [
      {
        id: "bt1",
        name: "Jaqueta Corta Vento Urban Tech",
        price: 289.90,
        description: "Impermeável, leve e respirável. Perfeita para o dia a dia e prática esportiva.",
        image_url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80",
        category: "Lançamentos",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "bt2",
        name: "Tênis Streetwear Hybrid V3",
        price: 349.90,
        description: "Amortecimento responsivo com solado em borracha vulcanizada de alta durabilidade.",
        image_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80",
        category: "Calçados",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "bt3",
        name: "Camiseta Pima Cotton Heavyweight",
        price: 119.90,
        description: "100% Algodão Pima peruano com caimento impecável e toque ultra macio.",
        image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
        category: "Moda Casual",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "bt4",
        name: "Mochila Impermeável Roll-Top 25L",
        price: 199.90,
        description: "Compartimento acolchoado para notebook de até 16 polegadas e bolsos selados.",
        image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
        category: "Acessórios",
        status: "Ativo",
        product_type: "physical",
      },
    ],
  },
  "demo-jo-perfumes": {
    store: {
      id: "demo-jo-perfumes",
      name: "Jô Perfumes & Cosméticos",
      slug: "demo-jo-perfumes",
      logo_url: null,
      banner_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80",
      whatsapp: "5511999999999",
    },
    themeId: "jo-perfumes",
    categories: [
      { id: "c1", name: "Feminino" },
      { id: "c2", name: "Masculino" },
      { id: "c3", name: "Lançamentos" },
      { id: "c4", name: "Kits & Presentes" },
    ],
    products: [
      {
        id: "jp1",
        name: "Âmbar Dourado Eau de Parfum 100ml",
        price: 189.90,
        description: "Fragrância marcante com notas de baunilha, âmbar e flor de laranjeira.",
        image_url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80",
        category: "Feminino",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "jp2",
        name: "Noir Absolu Intense 100ml",
        price: 219.90,
        description: "Amadeirado especiado elegante com notas de couro, cedro e pimenta preta.",
        image_url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
        category: "Masculino",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "jp3",
        name: "Rosa Delicata Parfum Floral 75ml",
        price: 159.90,
        description: "Buquê floral fresco com rosas de Grasse, peônia e almíscar branco.",
        image_url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&q=80",
        category: "Lançamentos",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "jp4",
        name: "Kit Presente Dourado Exclusivo",
        price: 299.90,
        description: "Contém 1 Perfume 100ml + 1 Hidratante Perfumado 200ml em caixa premium.",
        image_url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80",
        category: "Kits & Presentes",
        status: "Ativo",
        product_type: "physical",
      },
    ],
  },
  "demo-aura-maison": {
    store: {
      id: "demo-aura-maison",
      name: "Aura Maison Paris",
      slug: "demo-aura-maison",
      logo_url: null,
      banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    },
    themeId: "aura-maison",
    categories: [
      { id: "c1", name: "Alta Costura" },
      { id: "c2", name: "Bolsas & Couro" },
      { id: "c3", name: "Sapatos de Gala" },
      { id: "c4", name: "Acessórios Silk" },
    ],
    products: [
      {
        id: "am1",
        name: "Vestido Midi Seda Champagne",
        price: 1290.00,
        description: "Seda pura 100% com caimento fluido e decote drapeado nas costas.",
        image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
        category: "Alta Costura",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "am2",
        name: "Bolsa Tote Couro Legítimo Noir",
        price: 890.00,
        description: "Ferragens banhadas a ouro 18k e forro em veludo bordô.",
        image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
        category: "Bolsas & Couro",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "am3",
        name: "Scarpin Royale Salto Fino",
        price: 650.00,
        description: "Couro pelica com palmilha acolchoada e acabamento acetinado.",
        image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
        category: "Sapatos de Gala",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "am4",
        name: "Lenço Silk Twill Estampa Éden",
        price: 320.00,
        description: "Bainha enrolada à mão com estampa botânica exclusiva.",
        image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
        category: "Acessórios Silk",
        status: "Ativo",
        product_type: "physical",
      },
    ],
  },
  "demo-aurea-joalheria": {
    store: {
      id: "demo-aurea-joalheria",
      name: "Áurea Joalheria & Gemas",
      slug: "demo-aurea-joalheria",
      logo_url: null,
      banner_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=80",
    },
    themeId: "aurea-joalheria",
    categories: [
      { id: "c1", name: "Anéis Solitários" },
      { id: "c2", name: "Colares & Pingentes" },
      { id: "c3", name: "Brincos de Pérola" },
      { id: "c4", name: "Pulseiras Ouro 18k" },
    ],
    products: [
      {
        id: "aj1",
        name: "Anel Solitário Diamante Imperial 1ct",
        price: 4890.00,
        description: "Ouro amarelo 18k com diamante central lapidação brilhante.",
        image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
        category: "Anéis Solitários",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "aj2",
        name: "Colar Rivieria Esmeralda Colombiana",
        price: 7200.00,
        description: "Esmeraldas naturais selecionadas com fecho de segurança invisível.",
        image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
        category: "Colares & Pingentes",
        status: "Ativo",
        product_type: "physical",
      },
    ],
  },
  "demo-minimal-clean": {
    store: {
      id: "demo-minimal-clean",
      name: "Studio Minimal Store",
      slug: "demo-minimal-clean",
      logo_url: null,
      banner_url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=80",
    },
    themeId: "minimal-clean",
    categories: [
      { id: "c1", name: "Papelaria Fina" },
      { id: "c2", name: "Decoração & Design" },
    ],
    products: [
      {
        id: "m1",
        name: "Caderno Linen Minimalista A5",
        price: 89.00,
        description: "Capa em linho cru com papel pólen 90g pautado.",
        image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        category: "Papelaria Fina",
        status: "Ativo",
        product_type: "physical",
      },
      {
        id: "m2",
        name: "Luminária de Mesa Nórdica em Carvalho",
        price: 249.00,
        description: "Madeira maciça com lâmpada filamento de LED quente.",
        image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
        category: "Decoração & Design",
        status: "Ativo",
        product_type: "physical",
      },
    ],
  },
};

const PublicStore = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [themeCustomConfig, setThemeCustomConfig] = useState<Partial<ThemeCustomConfig> | null>(null);
  const [categories, setCategories] = useState<ThemeCategory[]>([]);
  const [products, setProducts] = useState<ThemeProduct[]>([]);
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      // Check Demo Stores for Instant Live Preview
      if (DEMO_STORES[slug]) {
        const demo = DEMO_STORES[slug];
        setStore(demo.store);
        setThemeId(demo.themeId);
        setThemeCustomConfig({ themeId: demo.themeId });
        setCategories(demo.categories);
        setProducts(
          demo.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.id,
            collection: p.category || "Geral",
            price: p.price,
            description: p.description || "",
            longDescription: p.description || "",
            images: [p.image_url || PLACEHOLDER_IMAGE],
            product_type: p.product_type || "physical",
          }))
        );
        setIsLoading(false);
        return;
      }

      // 1. Fetch store from Supabase
      const { data: storeData } = await supabase
        .from("stores")
        .select("*, templates(*)")
        .eq("slug", slug)
        .maybeSingle();

      if (storeData) {
        // Logo Resolution
        let resolvedLogo = storeData.logo_url;
        if (storeData.logo_url && !storeData.logo_url.startsWith("http")) {
          const { data: signedLogo } = await supabase.storage
            .from("products")
            .createSignedUrl(storeData.logo_url, 31536000);
          resolvedLogo = signedLogo?.signedUrl || storeData.logo_url;
        }

        // 2. Fetch Theme Config
        const { data: themeConfigData } = await supabase
          .from("store_theme_configs")
          .select("config")
          .eq("store_id", storeData.id)
          .maybeSingle();

        const rawConfig = (themeConfigData?.config as Partial<ThemeCustomConfig>) || null;
        const configTheme = rawConfig?.themeId || storeData.templates?.layout_key || "base-theme";
        setThemeId(configTheme);
        setThemeCustomConfig(rawConfig);

        setStore({
          id: storeData.id,
          slug: storeData.slug,
          name: storeData.name,
          logo_url: resolvedLogo,
          banner_url: storeData.banner_url,
          shipping_fee: storeData.shipping_fee,
          custom_domain: storeData.custom_domain,
          whatsapp: rawConfig?.social?.whatsapp || null,
          instagram: rawConfig?.social?.instagram || null,
        });

        // 3. Fetch Categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("store_id", storeData.id)
          .order("sort_order", { ascending: true });

        setCategories(categoriesData || []);

        // 4. Fetch Store Sections (Section Engine)
        const { data: dbSections } = await supabase
          .from("store_sections")
          .select("*")
          .eq("store_id", storeData.id)
          .order("position", { ascending: true });

        if (dbSections && dbSections.length > 0) {
          setSections(dbSections as any);
        } else {
          // Safe Fallback if store has no sections configured yet
          setSections([
            { id: "s1", store_id: storeData.id, section_type: "hero_slider", enabled: true, position: 10, settings: {} },
            { id: "s2", store_id: storeData.id, section_type: "benefits_bar", enabled: true, position: 20, settings: {} },
            { id: "s3", store_id: storeData.id, section_type: "video_feature", enabled: true, position: 30, settings: {} },
            { id: "s4", store_id: storeData.id, section_type: "social_feed", enabled: true, position: 40, settings: {} },
            { id: "s5", store_id: storeData.id, section_type: "whatsapp_cta", enabled: true, position: 50, settings: {} },
            { id: "s6", store_id: storeData.id, section_type: "newsletter", enabled: true, position: 60, settings: {} },
          ]);
        }

        // 5. Fetch Products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("status", "Ativo")
          .order("created_at", { ascending: false });

        if (productsData && productsData.length > 0) {
          const productsWithUrls: ThemeProduct[] = await Promise.all(
            productsData.map(async (p) => {
              let imgUrl = p.image_url;
              if (imgUrl && !imgUrl.startsWith("http")) {
                const { data: signedUrlData } = await supabase.storage
                  .from("products")
                  .createSignedUrl(imgUrl, 31536000);
                imgUrl = signedUrlData?.signedUrl || imgUrl;
              }
              return {
                id: p.id,
                name: p.name,
                slug: p.id,
                collection: p.category || "Geral",
                price: p.price,
                description: p.description || "",
                longDescription: p.description || "",
                images: [imgUrl || PLACEHOLDER_IMAGE],
                product_type: p.product_type || "physical",
              };
            })
          );
          setProducts(productsWithUrls);
        } else {
          setProducts([]);
        }
      }
      setIsLoading(false);
    };

    fetchStoreData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <h1 className="text-4xl font-heading font-bold mb-4">Loja não encontrada</h1>
        <p className="text-muted-foreground mb-8">O link que você acessou não corresponde a nenhuma loja ativa.</p>
        <Button asChild>
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    );
  }

  // 6. Merge theme config with defaults and build dynamic CSS Variables
  const customConfig = mergeThemeConfig(
    themeCustomConfig,
    themeId || (themeCustomConfig as any)?.themeId || "base-theme"
  );
  const cssVariables = buildThemeCssVariables(customConfig);

  // Resolve Storefront component from Theme Registry dynamically
  const StorefrontComponent = resolveThemeComponent(themeId);

  return (
    <div
      className="storefront-theme-root w-full min-h-screen"
      style={cssVariables as React.CSSProperties}
      data-theme-id={customConfig.themeId}
    >
      <StorefrontComponent
        store={store}
        categories={categories}
        products={products}
        colors={customConfig.colors}
        customConfig={customConfig}
        sections={sections}
      />
    </div>
  );
};

export default PublicStore;