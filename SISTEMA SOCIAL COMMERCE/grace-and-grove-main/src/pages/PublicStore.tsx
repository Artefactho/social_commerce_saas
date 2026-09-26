import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  User, 
  ArrowRight,
  Filter,
  Star,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

// Os produtos agora são carregados dinamicamente do banco de dados.
// Mantemos uma estrutura inicial vazia ou mockada caso a busca falhe.


const PublicStore = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const [store, setStore] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      // 1. Fetch store and template details
      const { data: storeData } = await supabase
        .from("stores")
        .select("*, templates(*)")
        .eq("slug", slug)
        .maybeSingle();

      if (storeData) {
        setStore(storeData);
        setTemplate(storeData.templates);
        
        // 2. Fetch products belonging to this store
        // We use a separate query to ensure RLS is correctly applied for anonymous users
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("status", "Ativo")
          .order("created_at", { ascending: false });
        
        if (productsData && productsData.length > 0) {
          // 3. Generate signed URLs for all product images
          const productsWithUrls = await Promise.all(productsData.map(async (product) => {
            if (product.image_url && !product.image_url.startsWith('http')) {
              const { data: signedUrlData } = await supabase.storage
                .from("products")
                .createSignedUrl(product.image_url, 31536000); // 1 year expiry
              
              return {
                ...product,
                image_url: signedUrlData?.signedUrl || product.image_url
              };
            }
            return product;
          }));
          setDbProducts(productsWithUrls);
        } else {
          setDbProducts([]);
        }
      }
      setIsLoading(false);
    };

    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-heading font-bold mb-4">Loja não encontrada</h1>
        <p className="text-muted-foreground mb-8">O link que você acessou não corresponde a nenhuma loja ativa.</p>
        <Button asChild>
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    );
  }

  const layoutKey = template?.layout_key || 'minimal';

  return (
    <div className={`min-h-screen ${
      layoutKey === 'minimal' ? 'bg-white text-zinc-900 font-sans' :
      layoutKey === 'bold' ? 'bg-zinc-950 text-white font-heading' :
      'bg-stone-50 text-stone-900 font-serif'
    }`}>
      {/* Dynamic Header */}
      <header className={`sticky top-0 z-50 border-b ${
        layoutKey === 'minimal' ? 'bg-white/80 backdrop-blur-md' :
        layoutKey === 'bold' ? 'bg-primary border-primary/20' :
        'bg-stone-900 text-white border-stone-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Menu className="w-6 h-6 lg:hidden" />
            <span className={`text-2xl font-bold tracking-tighter uppercase ${
              layoutKey === 'bold' ? 'italic' : ''
            }`}>
              {store.name}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-current">
            {['Novidades', 'Coleções', 'Ofertas', 'Sobre'].map(item => (
              <a key={item} href="#" className="hover:opacity-60 transition-opacity">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 hover:bg-black/5 rounded-full transition-colors"
              onClick={() => navigate("/checkout")}
            >
              <ShoppingBag className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Hero */}
      <section className={`relative overflow-hidden flex items-center justify-center ${
        layoutKey === 'minimal' ? 'h-[500px] bg-zinc-50' :
        layoutKey === 'bold' ? 'h-[600px] bg-primary' :
        'h-[700px] bg-stone-900'
      }`}>
        {layoutKey !== 'bold' && (
          <img 
            src={store.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"} 
            alt="Banner" 
            className={`absolute inset-0 w-full h-full object-cover ${
              layoutKey === 'premium' ? 'opacity-40 scale-110' : 'opacity-20'
            }`}
          />
        )}
        
        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center ${
          layoutKey === 'bold' ? 'text-white italic uppercase' : 'text-current'
        }`}>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-bold mb-6 leading-none ${
              layoutKey === 'minimal' ? 'text-5xl md:text-7xl tracking-tighter' :
              layoutKey === 'bold' ? 'text-7xl md:text-9xl tracking-tighter' :
              'text-6xl md:text-8xl italic'
            }`}
          >
            {layoutKey === 'minimal' ? 'Essencial & Puro' :
             layoutKey === 'bold' ? 'SEM LIMITES' :
             'A Arte do Detalhe'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg md:text-xl mb-12 max-w-2xl mx-auto ${
              layoutKey === 'bold' ? 'font-bold tracking-widest' : 'opacity-70'
            }`}
          >
            Descubra nossa nova coleção exclusiva selecionada especialmente para você.
          </motion.p>
          <Button 
            size="lg" 
            className={`h-16 px-12 text-lg font-bold rounded-none transition-transform hover:scale-105 ${
              layoutKey === 'minimal' ? 'bg-zinc-900 text-white' :
              layoutKey === 'bold' ? 'bg-white text-black' :
              'bg-stone-100 text-stone-900'
            }`}
          >
            EXPLORAR AGORA
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </div>

        {layoutKey === 'bold' && (
          <div className="absolute inset-0 -z-10 overflow-hidden opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]" />
          </div>
        )}
      </section>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-2 block">Novidades</span>
            <h2 className={`font-bold ${
              layoutKey === 'minimal' ? 'text-3xl' :
              layoutKey === 'bold' ? 'text-5xl italic uppercase tracking-tighter' :
              'text-4xl italic'
            }`}>
              Coleção Atual
            </h2>
          </div>
          <Button variant="link" className="font-bold uppercase tracking-widest text-current">Ver Todos</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {dbProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => {
                addItem({
                  id: product.id,
                  name: product.name,
                  slug: product.slug || product.id,
                  collection: product.category || "Geral",
                  price: product.price,
                  description: product.description || "",
                  longDescription: product.description || "",
                  materials: "",
                  images: [product.image_url],
                }, store.slug);
                toast.success(`${product.name} adicionado ao carrinho!`);
              }}
            >
              <div className={`relative aspect-[3/4] overflow-hidden mb-6 ${
                layoutKey === 'minimal' ? 'rounded-none' :
                layoutKey === 'bold' ? 'border-4 border-current hover:-translate-y-2 transition-transform' :
                'rounded-[3rem] scale-95 group-hover:scale-100 transition-transform duration-700'
              }`}>
                <img 
                  src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"}
                  alt={product.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6`}>
                  <Button className={`w-full h-14 font-black uppercase tracking-widest rounded-none ${
                    layoutKey === 'bold' ? 'bg-white text-black' : 'bg-white text-black'
                  }`}>
                    Comprar
                  </Button>
                </div>
              </div>
              <div className={layoutKey === 'bold' ? 'italic' : ''}>
                <h3 className="text-lg font-bold mb-1 uppercase tracking-tighter">{product.name}</h3>
                <p className="opacity-40 text-xs font-bold uppercase tracking-widest mb-2">{product.category}</p>
                <p className="text-xl font-black">R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </motion.div>
          ))}
          {dbProducts.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-40 uppercase tracking-widest font-bold">
              Nenhum produto disponível nesta coleção.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-24 px-4 ${
        layoutKey === 'minimal' ? 'bg-zinc-50 border-t' :
        layoutKey === 'bold' ? 'bg-primary text-white' :
        'bg-stone-900 text-white'
      }`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="space-y-6">
            <span className="text-2xl font-black uppercase tracking-tighter">{store.name}</span>
            <p className="text-sm font-bold opacity-60 leading-relaxed uppercase tracking-wider">
              Qualidade e estilo definidos por você.
            </p>
          </div>
          {['Ajuda', 'Empresa', 'Redes'].map(section => (
            <div key={section}>
              <h4 className="font-black uppercase tracking-widest mb-8 text-xs opacity-40">{section}</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest">
                {['Link 1', 'Link 2', 'Link 3'].map(link => (
                  <li key={link}><a href="#" className="hover:opacity-60 transition-opacity">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default PublicStore;