import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShoppingBag, Zap, Layout as LayoutIcon, Globe, MessageSquare, Instagram, Smartphone, BarChart3, Palette, CheckCircle2, Package, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMockup } from "@/components/HeroMockup";
import { DashboardMockup } from "@/components/DashboardMockup";
import { useState, useEffect } from "react";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'h-16 bg-background/80 backdrop-blur-xl border-b shadow-sm' : 'h-24 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tighter uppercase">SAAS COMMERCE</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#como-funciona" className="text-xs font-black hover:text-primary transition-colors tracking-widest uppercase">Como Funciona</a>
            <a href="#recursos" className="text-xs font-black hover:text-primary transition-colors tracking-widest uppercase">Recursos</a>
            <a href="#templates" className="text-xs font-black hover:text-primary transition-colors tracking-widest uppercase">Templates</a>
            <Link to="/planos" className="text-xs font-black hover:text-primary transition-colors tracking-widest uppercase">Preços</Link>
            <div className="h-4 w-[1px] bg-border" />
            <Button variant="ghost" className="text-xs font-black tracking-widest" asChild>
              <Link to="/login">ENTRAR</Link>
            </Button>
            <Button className="btn-premium px-8" asChild>
              <Link to="/signup">CRIAR MINHA LOJA</Link>
            </Button>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <LayoutIcon className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-6">
              <Zap className="w-3 h-3 fill-current" />
              Sua audiência já existe. Agora dê a ela uma loja.
            </div>
            <h1 className="font-heading text-5xl md:text-7xl mb-6 leading-[1.1]">
              Venda nas redes.<br />
              <span className="text-primary">Tenha sua própria loja.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Crie uma loja profissional em poucos minutos e transforme sua audiência em vendas reais. Sem complicações técnicas, apenas resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8 text-base font-bold btn-premium" asChild>
                <Link to="/signup">
                  CRIAR MINHA LOJA
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold" asChild>
                <a href="#como-funciona">VER COMO FUNCIONA</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 px-4 border-y overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading text-3xl md:text-5xl mb-4">Do perfil à primeira venda.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Um fluxo pensado para quem quer vender rápido, sem perder tempo com configurações complexas.</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8 relative">
            {[
              { step: "01", title: "CRIAR SUA LOJA", icon: LayoutIcon, desc: "Cadastre-se em segundos." },
              { step: "02", title: "ESCOLHER O VISUAL", icon: Globe, desc: "Templates que combinam com você." },
              { step: "03", title: "ADICIONAR PRODUTOS", icon: ShoppingBag, desc: "Fotos, preços e estoque." },
              { step: "04", title: "COMPARTILHAR", icon: MessageSquare, desc: "Link direto na bio ou chat." },
              { step: "05", title: "VENDER", icon: Zap, desc: "Receba pedidos e cresça." },
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/20">
                  <item.icon className="w-10 h-10" />
                </div>
                <span className="text-xs font-black text-primary mb-3 tracking-[0.2em]">{item.step}</span>
                <h3 className="font-heading text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{item.desc}</p>
              </motion.div>
            ))}
            
            {/* Connecting lines for desktop */}
            <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-3xl md:text-5xl mb-8 leading-tight">
                Você já tem audiência.<br />
                <span className="text-muted-foreground/50">Mas onde ela compra?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Instagram, TikTok, WhatsApp... Sua audiência está lá, mas o processo de venda é fragmentado. DMs, planilhas e links manuais matam sua conversão.
              </p>
              <div className="space-y-4">
                {[
                  "Conversas infinitas para fechar um pedido",
                  "Links de pagamento perdidos no chat",
                  "Falta de controle de estoque e pedidos",
                  "Experiência de compra amadora"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-3xl p-8 border border-white/20 bg-white/5 space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-white/10">
                  <span className="font-bold">Fragmentação</span>
                  <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 font-bold">PROBLEMA</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 grayscale opacity-50">
                    <Instagram className="text-pink-500" />
                    <span className="text-[10px] font-bold">DMs</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 grayscale opacity-50">
                    <Smartphone className="text-green-500" />
                    <span className="text-[10px] font-bold">WhatsApp</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 grayscale opacity-50 text-center">
                    <LayoutIcon className="text-blue-500" />
                    <span className="text-[10px] font-bold uppercase">Planilhas</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 grayscale opacity-50">
                    <ShoppingBag className="text-orange-500" />
                    <span className="text-[10px] font-bold">Estoque</span>
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">A solução está aqui</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20">
                    <ShoppingBag size={16} />
                    SAAS COMMERCE
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="recursos" className="py-24 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <DashboardMockup />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="font-heading text-3xl md:text-5xl mb-8 leading-tight">
                Uma loja profissional.<br />
                <span className="text-primary">Sem complicação.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Tenha tudo o que precisa para administrar sua operação em um único lugar. Do controle de estoque ao faturamento real.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                {[
                  { title: "Produtos", icon: Package },
                  { title: "Pedidos", icon: ShoppingBag },
                  { title: "Clientes", icon: Users },
                  { title: "Vendas", icon: BarChart3 },
                  { title: "Personalização", icon: Palette },
                  { title: "Domínio Próprio", icon: Globe },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <item.icon size={16} />
                    </div>
                    <span className="font-bold text-sm">{item.title}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="h-14 px-8 btn-premium" asChild>
                <Link to="/signup">EXPERIMENTAR GRÁTIS</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="para-quem" className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl mb-4">Feito para quem vende na internet.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Não importa o tamanho do seu negócio, o SaaS Commerce escala com você.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "CRIADORES", desc: "Transforme seguidores em clientes reais.", icon: Instagram },
            { title: "VENDEDORES SOCIAIS", desc: "Venda pelo Instagram, TikTok e WhatsApp.", icon: MessageSquare },
            { title: "PEQUENOS NEGÓCIOS", desc: "Tenha uma presença profissional sem depender de agência.", icon: Smartphone },
            { title: "MARCAS", desc: "Construa sua própria experiência de venda.", icon: Globe },
          ].map((item, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-[2rem] border border-white/20 bg-white/5 flex flex-col items-center text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon size={28} />
              </div>
              <h4 className="font-heading text-xl font-bold mb-3">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Store Builder Section */}
      <section id="templates" className="py-24 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            TEMPLATES EXCLUSIVOS
          </div>
          <h2 className="font-heading text-3xl md:text-5xl mb-4">Sua loja. Sua identidade visual.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Escolha um dos nossos designs prontos para converter, personalize em tempo real e comece a vender hoje mesmo.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "Jô Perfumes & Cosméticos",
              tag: "Perfumaria & Beleza",
              desc: "Stories dinâmicos, carrossel de ofertas e grade refinada no estilo Instagram Shop.",
              image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
              demoUrl: "/store/demo-jo-perfumes",
            },
            {
              name: "Aura Maison",
              tag: "Moda & Luxo",
              desc: "Tema oficial de alto padrão com catálogo sofisticado, drawer de carrinho e favoritos.",
              image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
              demoUrl: "/store/demo-aura-maison",
            },
            {
              name: "Áurea Joalheria",
              tag: "Joias & Acessórios",
              desc: "Contraste ônix e dourado com tipografia serifada de alta conversão.",
              image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
              demoUrl: "/store/demo-aurea-joalheria",
            },
            {
              name: "Minimal Clean",
              tag: "Moderno & Direto",
              desc: "Design clean e veloz com foco total na fotografia dos produtos.",
              image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
              demoUrl: "/store/demo-minimal-clean",
            },
          ].map((template, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl overflow-hidden border border-white/10 bg-card flex flex-col group transition-all"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                <img 
                  src={template.image} 
                  alt={template.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
                  {template.tag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-heading text-lg font-bold mb-2">{template.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{template.desc}</p>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                    asChild
                  >
                    <a href={template.demoUrl} target="_blank" rel="noreferrer">
                      <Eye size={14} />
                      Ver Demo Ao Vivo
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl mb-4">Tudo o que você precisa para vender.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Planos que cabem no seu bolso e evoluem com o seu negócio.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { name: "START", price: "49", features: ["Até 50 produtos", "Domínio próprio", "Suporte via chat"] },
            { name: "PRO", price: "99", features: ["Produtos ilimitados", "Relatórios avançados", "Faturamento ilimitado", "Personalização total"], popular: true },
            { name: "MASTER", price: "199", features: ["Tudo no PRO", "Checkout personalizado", "API de integração", "Gerente de conta"] },
          ].map((plan, i) => (
            <div key={i} className={`p-8 rounded-[2rem] border ${plan.popular ? 'border-primary ring-1 ring-primary bg-primary/5 relative' : 'border-white/20 bg-white/5'} flex flex-col`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  MAIS POPULAR
                </div>
              )}
              <h4 className="font-heading text-xl font-bold mb-2">{plan.name}</h4>
              <div className="mb-8">
                <span className="text-4xl font-bold">R$ {plan.price}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button className={plan.popular ? 'btn-premium' : ''} variant={plan.popular ? 'default' : 'outline'} asChild>
                <Link to="/signup">COMEÇAR AGORA</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl mb-12 text-center">Perguntas Frequentes</h2>
          <div className="space-y-6">
            {[
              { q: "Preciso saber programação?", a: "Não! O SaaS Commerce foi feito para quem não entende nada de código. Tudo é visual e intuitivo." },
              { q: "Posso vender pelo Instagram?", a: "Sim! Você cria sua loja, compartilha o link na sua bio ou nos stories e recebe os pedidos diretamente." },
              { q: "Como recebo meus pedidos?", a: "Todos os pedidos aparecem no seu dashboard em tempo real, com notificações imediatas para você não perder nada." },
              { q: "Existe plano gratuito?", a: "Sim, você pode começar a montar sua loja gratuitamente para conhecer todas as funcionalidades." },
            ].map((faq, i) => (
              <div key={i} className="glass p-6 rounded-2xl border border-white/20 bg-white/5">
                <h4 className="font-bold mb-3">{faq.q}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center glass rounded-[3rem] p-12 md:p-24 relative overflow-hidden border border-white/20 bg-white/5 shadow-2xl">
          <div className="relative z-10">
            <h2 className="font-heading text-4xl md:text-7xl mb-8 leading-tight">Pronto para transformar sua audiência em vendas?</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">Crie sua loja, compartilhe seu link e comece a vender hoje mesmo.</p>
            <Button size="lg" className="h-16 px-12 text-lg font-bold btn-premium shadow-xl shadow-primary/30" asChild>
              <Link to="/signup">CRIAR MINHA LOJA AGORA</Link>
            </Button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t px-4 bg-background">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tighter uppercase">SAAS COMMERCE</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              A plataforma definitiva para criadores e vendedores sociais transformarem sua presença online em um negócio lucrativo.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase text-xs tracking-widest">Produto</h5>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a></li>
              <li><a href="#para-quem" className="hover:text-primary transition-colors">Recursos</a></li>
              <li><a href="#templates" className="hover:text-primary transition-colors">Templates</a></li>
              <li><Link to="/planos" className="hover:text-primary transition-colors">Preços</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase text-xs tracking-widest">Suporte</h5>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-50">© 2026 SaaS Commerce. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Instagram size={18} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <Globe size={18} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;