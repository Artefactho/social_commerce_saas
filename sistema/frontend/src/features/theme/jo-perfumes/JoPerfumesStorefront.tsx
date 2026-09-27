import React, { useState, useMemo } from "react";
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  User, 
  X, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Verified, 
  Tag, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  ArrowRight,
  Sparkles,
  Share2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { Product } from "@/data/products";
import { ThemeCategory, ThemeColors } from "../aura-maison/Header";
import { CartDrawer } from "../aura-maison/CartDrawer";
import { WishlistDrawer } from "../aura-maison/WishlistDrawer";
import { ProductQuickViewModal } from "../aura-maison/ProductQuickViewModal";

interface StoreInfo {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  banner_url?: string | null;
}

interface JoPerfumesStorefrontProps {
  store: StoreInfo;
  categories: ThemeCategory[];
  products: Product[];
  colors?: ThemeColors;
}

export const JoPerfumesStorefront: React.FC<JoPerfumesStorefrontProps> = ({
  store,
  categories,
  products,
}) => {
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Slides do Hero Carousel
  const slides = useMemo(() => [
    {
      image: store.banner_url || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80",
      title: store.name || "Perfumaria Exclusiva",
      subtitle: "Descubra fragrâncias e produtos que contam a sua história",
      ctaText: "Ver Lançamentos",
    },
    {
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80",
      title: "Essências Marcantes",
      subtitle: "Qualidade e sofisticação em cada detalhe",
      ctaText: "Explorar Catálogo",
    },
    {
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1600&q=80",
      title: "Coleção Premium 2026",
      subtitle: "Seleção especial com entrega rápida para todo o Brasil",
      ctaText: "Aproveitar Ofertas",
    },
  ], [store]);

  // Story Highlights dinâmicos baseados nas categorias reais da loja
  const stories = useMemo(() => {
    const defaultIcons = [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=200&h=200&fit=crop",
    ];

    if (categories.length > 0) {
      return [
        { id: "all", label: "Todos", image: defaultIcons[0] },
        ...categories.map((c, i) => ({
          id: c.name,
          label: c.name,
          image: defaultIcons[(i + 1) % defaultIcons.length],
        })),
      ];
    }

    return [
      { id: "all", label: "Destaques", image: defaultIcons[0] },
      { id: "Feminino", label: "Feminino", image: defaultIcons[1] },
      { id: "Masculino", label: "Masculino", image: defaultIcons[2] },
      { id: "Ofertas", label: "Promoções", image: defaultIcons[3] },
      { id: "Kits", label: "Kits & Presentes", image: defaultIcons[4] },
    ];
  }, [categories]);

  // Filtragem de produtos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && selectedCategory !== "all" && p.collection !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.images?.[0] || "",
      product_type: product.product_type || "physical",
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
    setIsCartOpen(true);
  };

  const handleToggleWishlist = (product: Product) => {
    if (wishlist.isInWishlist(product.id)) {
      wishlist.removeItem(product.id);
      toast.info("Removido dos favoritos");
    } else {
      wishlist.addItem(product);
      toast.success("Adicionado aos favoritos!");
    }
  };

  const formatBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div 
      className="min-h-screen selection:bg-rose-500 selection:text-white pb-20 md:pb-8 transition-colors duration-200"
      style={{
        backgroundColor: "var(--theme-background, #0d0d0f)",
        color: "var(--theme-text, #f4f4f5)",
        fontFamily: "var(--theme-font-body, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* 1. Header do Social Commerce */}
      <header className="sticky top-0 z-40 bg-[#131316]/90 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          {/* Logo & Nome da Loja */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 p-[2px] shadow-md shadow-rose-500/20">
              <div className="w-full h-full bg-[#18181c] rounded-2xl overflow-hidden flex items-center justify-center">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-black tracking-tight text-white">
                    {store.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">{store.name}</h1>
                <Verified className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">Loja Oficial Verificada</span>
            </div>
          </div>

          {/* Busca & Ações */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-200">
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar fragrâncias ou produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-72 bg-zinc-800/90 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="absolute right-2.5 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Buscar"
              >
                <Search size={18} />
              </button>
            )}

            {/* Favoritos */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2.5 relative text-zinc-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Favoritos"
            >
              <Heart size={18} />
              {wishlist.items.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-in zoom-in">
                  {wishlist.items.length}
                </span>
              )}
            </button>

            {/* Carrinho */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 relative text-white bg-rose-500 hover:bg-rose-600 rounded-full shadow-lg shadow-rose-500/25 transition-all hover:scale-105"
              title="Carrinho"
            >
              <ShoppingBag size={18} />
              {cart.getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-zinc-950 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                  {cart.getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Carousel Dinâmico */}
      <section className="relative w-full h-[280px] sm:h-[400px] lg:h-[460px] overflow-hidden group bg-zinc-900">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-black/40 to-black/20" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold tracking-wider uppercase mb-2 backdrop-blur-md">
                <Sparkles size={12} /> Destaque da Semana
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md mb-2">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mb-5 drop-shadow">
                {slide.subtitle}
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById("catalogo-produtos");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                {slide.ctaText}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Controles do Carousel */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronRight size={18} />
        </button>
      </section>

      {/* 3. Perfil da Loja / Bio Estilo Instagram */}
      <section className="px-4 py-4 max-w-7xl mx-auto -mt-6 relative z-10">
        <div className="bg-[#16161a] rounded-3xl border border-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-[2px] shadow-lg">
                <div className="w-full h-full bg-[#121214] rounded-2xl overflow-hidden flex items-center justify-center">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-rose-400">
                      {store.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">{store.name}</h3>
                  <Verified size={18} className="text-rose-500 fill-rose-500/20" />
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Tag size={12} className="text-rose-400" />
                  Perfumaria & Cosméticos Premium
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="flex items-center gap-6 w-full sm:w-auto justify-around py-2 sm:py-0 bg-white/5 sm:bg-transparent rounded-2xl px-4">
              <div className="text-center">
                <p className="text-base font-black text-white">{products.length}</p>
                <p className="text-[11px] text-zinc-400">Produtos</p>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="text-center">
                <p className="text-base font-black text-white">4.9 ★</p>
                <p className="text-[11px] text-zinc-400">Avaliações</p>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="text-center">
                <p className="text-base font-black text-white">100%</p>
                <p className="text-[11px] text-zinc-400">Seguro</p>
              </div>
            </div>
          </div>

          {/* Bio & Detalhes */}
          <div className="pt-3.5">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              ✨ Fragrâncias exclusivas e produtos selecionados para encantar seus sentidos.<br />
              🚚 Enviamos com rapidez e carinho para todo o Brasil.
            </p>

            <button
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              className="mt-3 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              {isProfileExpanded ? "Ocultar informações da loja" : "Ver canais de atendimento & contato"}
              {isProfileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isProfileExpanded && (
              <div className="mt-3.5 pt-3.5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-white/5 p-2.5 rounded-xl">
                  <Mail size={14} className="text-rose-400" />
                  <span className="truncate">contato@{store.slug}.com.br</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-white/5 p-2.5 rounded-xl">
                  <Phone size={14} className="text-emerald-400" />
                  <span>WhatsApp Oficial</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-white/5 p-2.5 rounded-xl">
                  <MapPin size={14} className="text-amber-400" />
                  <span>Entrega em todo o Brasil</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Stories / Destaques em Círculos */}
      <section className="py-4 px-4 max-w-7xl mx-auto">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {stories.map((story) => {
            const isSelected = selectedCategory === (story.id === "all" ? "" : story.id);
            return (
              <button
                key={story.id}
                onClick={() => setSelectedCategory(story.id === "all" ? "" : story.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-tr from-rose-500 via-amber-400 to-rose-600 scale-105 ring-2 ring-rose-500/50"
                    : "bg-gradient-to-tr from-zinc-700 to-zinc-800 hover:from-rose-500/70 hover:to-amber-500/70"
                }`}>
                  <div className="w-full h-full rounded-full border-2 border-[#0d0d0f] overflow-hidden bg-zinc-800">
                    <img
                      src={story.image}
                      alt={story.label}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
                <span className={`text-xs font-medium tracking-tight ${isSelected ? "text-rose-400 font-bold" : "text-zinc-300"}`}>
                  {story.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Catálogo de Produtos em Grid */}
      <section id="catalogo-produtos" className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {selectedCategory ? `Coleção: ${selectedCategory}` : "Catálogo em Destaque"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory("")}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold underline"
            >
              Ver todos os produtos
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#16161a] rounded-3xl border border-white/5 p-8">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Nenhum produto encontrado</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
              Não encontramos nenhum item para a categoria ou termo de busca selecionado.
            </p>
            <button
              onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}
              className="px-5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((p) => {
              const isFav = wishlist.isInWishlist(p.id);
              return (
                <div
                  key={p.id}
                  className="group bg-[#16161a] rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300"
                >
                  {/* Foto do Produto */}
                  <div
                    className="relative aspect-square overflow-hidden bg-zinc-900 cursor-pointer"
                    onClick={() => setQuickViewProduct(p)}
                  >
                    <img
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Botão Favoritar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(p);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      <Heart
                        size={15}
                        className={isFav ? "fill-rose-500 text-rose-500" : "text-white"}
                      />
                    </button>

                    {/* Badge Destaque */}
                    {p.featured && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md">
                        Destaque
                      </span>
                    )}
                  </div>

                  {/* Detalhes & Preço */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        {p.collection || "Geral"}
                      </span>
                      <h4
                        className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 cursor-pointer hover:text-rose-300 transition-colors"
                        onClick={() => setQuickViewProduct(p)}
                      >
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">
                        {p.description || "Fragrância marcante e duradoura."}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {formatBRL(p.price)}
                        </span>
                        <span className="block text-[9px] text-emerald-400 font-medium">
                          em até 3x sem juros
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(p)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Comprar"
                      >
                        <ShoppingBag size={14} />
                        <span className="hidden sm:inline">Comprar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Barra Inferior Mobile (Bottom Nav) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121214]/95 backdrop-blur-xl border-t border-white/10 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-rose-500"
          >
            <Home size={18} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-400 hover:text-white"
          >
            <Search size={18} />
            <span className="text-[10px] font-medium">Buscar</span>
          </button>
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-400 hover:text-white relative"
          >
            <Heart size={18} />
            {wishlist.items.length > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
            <span className="text-[10px] font-medium">Favoritos</span>
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-400 hover:text-white relative"
          >
            <ShoppingBag size={18} />
            {cart.getItemCount() > 0 && (
              <span className="absolute top-0 right-2 bg-rose-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {cart.getItemCount()}
              </span>
            )}
            <span className="text-[10px] font-medium">Carrinho</span>
          </button>
        </div>
      </nav>

      {/* 7. Drawers e Modais Reutilizáveis do Ecossistema */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        storeSlug={store.slug}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};
