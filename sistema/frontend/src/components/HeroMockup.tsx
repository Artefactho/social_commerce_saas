import { motion } from "framer-motion";
import { ShoppingBag, Instagram, Send, Play, Heart, MessageCircle } from "lucide-react";

export const HeroMockup = () => {
  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      {/* Social Media Floaties */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -left-12 z-20 glass p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-primary/20"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white">
          <Instagram size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Novo Seguidor</p>
          <p className="text-xs font-bold">@mariasilva</p>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 -right-16 z-20 glass p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-primary/20"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <Send size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Novo Pedido</p>
          <p className="text-xs font-bold">R$ 259,90</p>
        </div>
      </motion.div>

      {/* Main Mockup */}
      <div className="relative z-10 glass rounded-[2.5rem] p-3 shadow-2xl border border-white/20 overflow-hidden bg-white/5">
        <div className="bg-background rounded-[2rem] overflow-hidden border border-border aspect-[9/16] relative">
          {/* Store Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-[10px] text-white font-bold">M</div>
              <span className="text-xs font-bold">MINIMAL STORE</span>
            </div>
            <ShoppingBag size={16} className="text-muted-foreground" />
          </div>

          {/* Banner */}
          <div className="h-40 bg-muted relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" 
              alt="Store Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4">
              <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">NEW COLLECTION</span>
            </div>
          </div>

          {/* Products */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square rounded-xl bg-muted overflow-hidden">
                  <img 
                    src={i === 1 ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80" : "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80"} 
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-2 w-12 bg-muted rounded" />
                <div className="h-3 w-20 bg-primary/20 rounded" />
                <div className="h-6 w-full bg-primary rounded-lg" />
              </div>
            ))}
          </div>

          {/* Social Icons Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white border border-white/20">
                <Heart size={14} />
             </div>
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white border border-white/20">
                <MessageCircle size={14} />
             </div>
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white border border-white/20">
                <Send size={14} />
             </div>
          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full -z-10" />
    </div>
  );
};
