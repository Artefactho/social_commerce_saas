import React, { useState } from "react";
import { StoreSection, StoreInfo, ThemeCategory, ThemeProduct } from "@/types/theme";
import { 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight, 
  ShoppingBag, 
  Play, 
  Instagram, 
  Sparkles, 
  Send, 
  CheckCircle2,
  Tag
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { buildWhatsAppLink } from "@/utils/whatsapp";

interface SectionComponentProps {
  settings: Record<string, any>;
  store: StoreInfo;
  categories: ThemeCategory[];
  products: ThemeProduct[];
}

export const HeroSliderSection: React.FC<SectionComponentProps> = ({ settings, store }) => {
  const title = settings.title || store.name;
  const subtitle = settings.subtitle || "Destaques & Ofertas Especiais";
  const buttonText = settings.buttonText || "VER PRODUTOS";
  const image = settings.image || store.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80";

  return (
    <div className="relative h-[450px] md:h-[540px] bg-black text-white flex items-center overflow-hidden">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="max-w-xl space-y-4">
          <span className="inline-block text-xs uppercase tracking-widest font-black bg-amber-400 text-black px-3 py-1 rounded-full">
            {subtitle}
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight">{title}</h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            {settings.description || "Os melhores produtos selecionados para você com entrega rápida e pagamento facilitado."}
          </p>
          <div className="pt-2">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-100 font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider transition-all shadow-xl"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BenefitsBarSection: React.FC<SectionComponentProps> = () => {
  return (
    <div className="bg-white border-y border-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Frete Seguro</h4>
            <p className="text-[11px] text-gray-500">Envio para todo Brasil</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Até 12x no Cartão</h4>
            <p className="text-[11px] text-gray-500">Ou desconto no Pix</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Compra 100% Segura</h4>
            <p className="text-[11px] text-gray-500">Garantia total</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900">Suporte WhatsApp</h4>
            <p className="text-[11px] text-gray-500">Atendimento rápido</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoFeatureSection: React.FC<SectionComponentProps> = ({ settings }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const title = settings.title || "Conheça Nossa Coleção em Ação";
  const subtitle = settings.subtitle || "Vídeo Exclusivo";
  const description = settings.description || "Descubra cada detalhe de acabamento, caimento e sofisticação dos nossos produtos.";
  const videoUrl = settings.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4";
  const posterUrl = settings.posterUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80";

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          {subtitle}
        </span>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">{title}</h2>
        <p className="text-xs md:text-sm text-gray-500">{description}</p>
      </div>

      <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-200">
        {!isPlaying ? (
          <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
            <img src={posterUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
            <button className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all">
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-xs uppercase tracking-wider font-bold bg-black/60 px-3 py-1 rounded-full">Clique para Assistir</span>
            </div>
          </div>
        ) : (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </section>
  );
};

export const SocialFeedSection: React.FC<SectionComponentProps> = ({ settings, store }) => {
  const handle = settings.handle || store.instagram || `@${store.slug}`;
  const title = settings.title || "Siga no Instagram";
  const subtitle = settings.subtitle || "Galeria Social";

  const posts = [
    { img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80", likes: "1.2k" },
    { img: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80", likes: "840" },
    { img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80", likes: "2.4k" },
    { img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80", likes: "950" },
    { img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80", likes: "1.8k" },
    { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", likes: "3.1k" },
  ];

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
            {subtitle}
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mt-2">{title}</h2>
          <p className="text-xs text-gray-500">Inspire-se com os looks e novidades da comunidade</p>
        </div>
        <a
          href={`https://instagram.com/${handle.replace("@", "")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-pink-600 transition-colors uppercase tracking-wider"
        >
          <Instagram className="w-4 h-4 text-pink-600" />
          <span>{handle}</span>
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {posts.map((p, idx) => (
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
  );
};

export const WhatsAppCtaSection: React.FC<SectionComponentProps> = ({ store }) => {
  const whatsappUrl = buildWhatsAppLink({ phone: store.whatsapp });

  return (
    <div className="bg-emerald-600 text-white py-14 px-4 my-8 rounded-3xl max-w-7xl mx-auto shadow-xl">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest bg-white/20 px-3 py-1 rounded-full">
            Atendimento Exclusivo
          </span>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Atendimento Direto no WhatsApp</h2>
          <p className="text-emerald-100 text-sm">
            Tire dúvidas sobre produtos, prazos e finalize seu pedido com nossa equipe.
          </p>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-full font-black text-sm uppercase tracking-wider transition-all shadow-xl shrink-0"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Falar no WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
};

export const NewsletterSection: React.FC<SectionComponentProps> = ({ settings }) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setSubscribed(true);
    toast.success("Obrigado por se inscrever!");
  };

  return (
    <section className="bg-gray-900 text-white py-14 px-4 my-8 rounded-3xl max-w-7xl mx-auto shadow-xl">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <span className="text-xs uppercase font-black tracking-widest bg-amber-400 text-black px-3 py-1 rounded-full">
          {settings.badge || "Newsletter Exclusiva"}
        </span>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
          {settings.title || "Receba Descontos e Lançamentos em Primeira Mão"}
        </h2>
        <p className="text-xs md:text-sm text-gray-400">
          {settings.description || "Cadastre seu e-mail e receba 10% de desconto no seu primeiro pedido."}
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm pt-4">
            <CheckCircle2 className="w-5 h-5" />
            <span>Inscrição confirmada com sucesso!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>{settings.buttonText || "Cadastrar"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

const SECTION_MAP: Record<string, React.FC<SectionComponentProps>> = {
  hero_slider: HeroSliderSection,
  benefits_bar: BenefitsBarSection,
  video_feature: VideoFeatureSection,
  social_feed: SocialFeedSection,
  whatsapp_cta: WhatsAppCtaSection,
  newsletter: NewsletterSection,
};

interface SectionRendererProps {
  sections: StoreSection[];
  store: StoreInfo;
  categories: ThemeCategory[];
  products: ThemeProduct[];
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  sections,
  store,
  categories,
  products,
}) => {
  const activeSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col gap-y-4">
      {activeSections.map((section) => {
        const Component = SECTION_MAP[section.section_type];
        if (!Component) return null;
        return (
          <div key={section.id} id={`section-${section.id}`} data-section-type={section.section_type}>
            <Component
              settings={section.settings || {}}
              store={store}
              categories={categories}
              products={products}
            />
          </div>
        );
      })}
    </div>
  );
};
