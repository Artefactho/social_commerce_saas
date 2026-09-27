import React, { useState } from "react";
import { StorefrontThemeProps, ThemeProduct } from "@/types/theme";
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MessageCircle, 
  Instagram, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Play,
  CheckCircle2,
  Share2
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SectionRenderer } from "@/features/sections/SectionRenderer";
import { buildWhatsAppLink } from "@/utils/whatsapp";

export const BaseThemeStorefront: React.FC<StorefrontThemeProps> = ({
  store,
  categories,
  products,
  colors,
  customConfig,
  sections,
}) => {
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<ThemeProduct | null>(null);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const whatsappUrl = buildWhatsAppLink({ 
    phone: store.whatsapp, 
    message: customConfig?.social?.whatsappMessage 
  });

  const heroSlides = [
    {
      title: store.name,
      subtitle: "Coleção Exclusiva & Ofertas Especiais",
      description: "Os melhores produtos selecionados para você com entrega rápida e pagamento facilitado.",
      image: store.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
      buttonText: "VER PRODUTOS",
    },
    {
      title: "Lançamentos da Estação",
      subtitle: "Qualidade Premium Garantida",
      description: "Confira as últimas novidades que acabaram de chegar na nossa loja.",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=80",
      buttonText: "EXPLORAR AGORA",
    },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" ||
      p.collection.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: ThemeProduct, quantity: number = 1) => {
    for (let i = 0; i < quantity; i++) {
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || "",
          product_type: product.product_type,
        },
        store.slug
      );
    }
    toast.success(`${product.name} adicionado à sacola!`);
  };

  return (
    <div 
      className="min-h-screen antialiased transition-colors duration-200"
      style={{
        backgroundColor: "var(--theme-background, #FDFDFD)",
        color: "var(--theme-text, #222222)",
        fontFamily: "var(--theme-font-body, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* 1. Barra de Anúncio / Top Banner */}
      <div className="bg-[#111111] text-white text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Frete grátis para todo o Brasil em pedidos selecionados • Parcele em até 12x</span>
      </div>

      {/* 2. Header & Navegação */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo & Name */}
          <div 
            onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }} 
            className="flex items-center gap-3 cursor-pointer"
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-md">
                {store.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-gray-900">{store.name}</span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Loja Oficial</span>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="O que você está procurando hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* User Utilities & Cart */}
          <div className="flex items-center gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors border border-emerald-200"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => navigate("/checkout")}
              className="relative flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Sacola</span>
              {getItemCount() > 0 && (
                <span className="w-5 h-5 bg-amber-400 text-black text-[11px] font-black rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Navigation Bar (Desktop) */}
        <nav className="hidden md:flex border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 overflow-x-auto py-2.5 text-xs font-bold tracking-wide uppercase text-gray-600">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`hover:text-black transition-colors whitespace-nowrap ${selectedCategory === "all" ? "text-black border-b-2 border-black pb-0.5" : ""}`}
            >
              Todos os Departamentos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`hover:text-black transition-colors whitespace-nowrap ${selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "text-black border-b-2 border-black pb-0.5" : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl p-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="font-extrabold uppercase text-lg">{store.name}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Departamentos</span>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory("all"); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold ${
                      selectedCategory === "all" ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    Todos os Departamentos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.name); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold ${
                        selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Atendimento WhatsApp</span>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Section Engine (if configured) or Default Hero & Banners */}
      {sections && sections.length > 0 ? (
        <SectionRenderer
          sections={sections}
          store={store}
          categories={categories}
          products={products}
        />
      ) : (
        <>
          {/* 3. Hero Slider */}
          <section className="relative overflow-hidden bg-gray-900 text-white">
            <div className="relative h-[460px] md:h-[560px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  <img
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </motion.div>
              </AnimatePresence>

              <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
                <div className="max-w-xl space-y-4">
                  <span className="inline-block text-xs uppercase tracking-[0.2em] font-extrabold bg-amber-400 text-black px-3 py-1 rounded-full">
                    {heroSlides[currentSlide].subtitle}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight">
                    {heroSlides[currentSlide].title}
                  </h1>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    {heroSlides[currentSlide].description}
                  </p>
                  <div className="pt-2">
                    <a
                      href="#catalogo"
                      className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-100 font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider transition-all shadow-xl hover:gap-3"
                    >
                      <span>{heroSlides[currentSlide].buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Slider Arrows */}
              <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* 4. Services / Informative Banners */}
          <section className="bg-white border-b border-gray-100 py-6 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Envio para Todo Brasil</h4>
                  <p className="text-[11px] text-gray-500">Rastreamento garantido</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Até 12x no Cartão</h4>
                  <p className="text-[11px] text-gray-500">Ou 5% de desconto no Pix</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Compra 100% Segura</h4>
                  <p className="text-[11px] text-gray-500">Garantia total de entrega</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Suporte Dedicado</h4>
                  <p className="text-[11px] text-gray-500">Atendimento via WhatsApp</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

          {/* 5. Categories Showcase */}
          {categories.length > 0 && (
            <section className="py-12 px-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900">Categorias em Destaque</h2>
                  <p className="text-xs text-gray-500">Navegue pelas principais seções da loja</p>
                </div>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs font-bold text-black hover:underline uppercase"
                >
                  Ver Todas
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`group p-4 rounded-2xl border text-center transition-all ${
                      selectedCategory.toLowerCase() === category.name.toLowerCase()
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-400 text-gray-900"
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                      🛍️
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-tight line-clamp-1">{category.name}</h3>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 6. Product Grid (with QuickShop "Espiar") */}
          <section id="catalogo" className="py-12 px-4 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
                  {selectedCategory === "all" ? "Todos os Produtos" : `Categoria: ${selectedCategory}`}
                </h2>
                <p className="text-xs text-gray-500">{filteredProducts.length} itens disponíveis para pronta entrega</p>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    selectedCategory === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-700">Nenhum produto encontrado nesta categoria</h3>
                <button
                  onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                  className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full uppercase tracking-wider"
                >
                  Ver Todo o Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                        {product.collection}
                      </span>

                      {/* Quick Shop Button (Espiar) */}
                      <button
                        onClick={() => {
                          setQuickViewProduct(product);
                          setQuickViewQuantity(1);
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-black hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        title="Espiar Produto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Add to Cart Quick Button */}
                      <button
                        onClick={() => handleAddToCart(product, 1)}
                        className="absolute bottom-3 left-3 right-3 bg-black hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Comprar Agora</span>
                      </button>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-xs md:text-sm text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
                      <div className="pt-1">
                        <div className="text-base font-extrabold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          12x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price / 12)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* 7. Video Showcase Section */}
          <section className="py-12 px-4 max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Vídeo em Destaque
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">Conheça Nossa Coleção</h2>
              <p className="text-xs md:text-sm text-gray-500">Assista aos detalhes e confira o padrão de acabamento dos nossos produtos.</p>
            </div>

            <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-200">
              <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsVideoModalOpen(true)}>
                <img
                  src={store.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"}
                  alt="Video cover"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <button className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              </div>
            </div>
          </section>

          {/* 8. Social Feed / Instagram Gallery */}
          <section className="py-12 px-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                  Galeria Social
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mt-2">Siga no Instagram</h2>
                <p className="text-xs text-gray-500">Inspire-se com os looks e novidades da comunidade</p>
              </div>
              <a
                href={store.instagram ? `https://instagram.com/${store.instagram.replace("@", "")}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-pink-600 transition-colors uppercase tracking-wider"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>{store.instagram || `@${store.slug}`}</span>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {[
                { img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80", likes: "1.2k" },
                { img: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80", likes: "840" },
                { img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80", likes: "2.4k" },
                { img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80", likes: "950" },
                { img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80", likes: "1.8k" },
                { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", likes: "3.1k" },
              ].map((p, idx) => (
                <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                  <img src={p.img} alt="Instagram post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Instagram className="w-4 h-4" />
                    <span>{p.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9. WhatsApp CTA */}
          <section className="bg-emerald-600 text-white py-14 px-4 my-12">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-2 max-w-lg">
                <span className="text-xs uppercase font-extrabold tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Atendimento VIP
                </span>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Prefere comprar pelo WhatsApp?</h2>
                <p className="text-emerald-100 text-sm">
                  Nossa equipe está disponível agora para tirar dúvidas e finalizar seu pedido com atendimento personalizado.
                </p>
              </div>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-full font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 shrink-0"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Chamar no WhatsApp</span>
                </a>
              ) : (
                <button
                  onClick={() => navigate("/checkout")}
                  className="inline-flex items-center gap-3 bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-full font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 shrink-0"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Comprar Online</span>
                </button>
              )}
            </div>
          </section>

      {/* QuickShop Functional Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-gray-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl grid md:grid-cols-2 relative"
          >
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-square bg-gray-100">
              <img
                src={quickViewProduct.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                  {quickViewProduct.collection}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight">{quickViewProduct.name}</h3>
                <div className="text-2xl font-extrabold text-gray-900">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(quickViewProduct.price)}
                </div>
                <p className="text-xs text-emerald-700 font-semibold">
                  Até 12x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(quickViewProduct.price / 12)}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed pt-2">
                  {quickViewProduct.description || "Produto oficial de alta durabilidade e pronta entrega."}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-500">Quantidade</span>
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1">
                    <button
                      onClick={() => setQuickViewQuantity(Math.max(1, quickViewQuantity - 1))}
                      className="p-1 hover:text-black text-gray-500"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{quickViewQuantity}</span>
                    <button
                      onClick={() => setQuickViewQuantity(quickViewQuantity + 1)}
                      className="p-1 hover:text-black text-gray-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(quickViewProduct, quickViewQuantity);
                    setQuickViewProduct(null);
                  }}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar à Sacola</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Video Fullscreen Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 10. Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4 md:col-span-1">
            <span className="text-xl font-black text-white uppercase tracking-tight">{store.name}</span>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sua loja oficial de comércio social. Produtos exclusivos, atendimento rápido e entrega garantida.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Departamentos</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button onClick={() => setSelectedCategory(cat.name)} className="hover:text-white transition-colors">
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Ajuda & Suporte</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span>Prazos de Entrega</span></li>
              <li><span>Trocas e Devoluções</span></li>
              <li><span>Termos e Condições</span></li>
              <li><span>Política de Privacidade</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Formas de Pagamento</h5>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span className="px-2.5 py-1 bg-gray-800 rounded border border-gray-700 text-white font-bold">PIX</span>
              <span className="px-2.5 py-1 bg-gray-800 rounded border border-gray-700 text-white font-bold">Cartão de Crédito</span>
              <span className="px-2.5 py-1 bg-gray-800 rounded border border-gray-700 text-white font-bold">Boleto</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente 100% Seguro</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 {store.name}. Todos os direitos reservados.</p>
          <p className="font-semibold text-gray-400">Powered by Social Commerce SaaS</p>
        </div>
      </footer>
    </div>
  );
};
