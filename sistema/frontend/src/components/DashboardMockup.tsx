import { motion } from "framer-motion";
import { CheckCircle2, ShoppingCart, Users, Package, BarChart3, Palette } from "lucide-react";

export const DashboardMockup = () => {
  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <div className="glass rounded-3xl p-4 shadow-2xl border border-white/20 bg-white/5 overflow-hidden">
        <div className="bg-background rounded-2xl border border-border overflow-hidden">
          {/* Dashboard Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
            <div className="flex gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background border rounded-lg">
              <span className="text-[10px] text-muted-foreground font-medium">dashboard.saascommerce.com</span>
            </div>
          </div>

          <div className="flex h-[320px]">
            {/* Sidebar */}
            <div className="w-20 border-r bg-muted/20 p-4 flex flex-col items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <BarChart3 size={20} />
              </div>
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
                <Package size={16} />
              </div>
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
                <Users size={16} />
              </div>
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
                <Palette size={16} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-background space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendas Hoje</p>
                  <p className="text-xl font-bold">R$ 1.240,00</p>
                  <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "70%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-background space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pedidos</p>
                  <p className="text-xl font-bold">12</p>
                  <div className="h-1 w-full bg-green-500/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold">Últimos Pedidos</p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 text-[10px]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users size={12} />
                      </div>
                      <div>
                        <p className="font-bold">Cliente #{1024 + i}</p>
                        <p className="text-muted-foreground">há 5 minutos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ 129,90</p>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-bold uppercase">Pago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Absolute floating elements */}
      <motion.div
        animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -right-10 glass p-3 rounded-2xl border border-primary/20 shadow-xl flex items-center gap-2"
      >
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
          <CheckCircle2 size={14} />
        </div>
        <span className="text-xs font-bold">Loja Publicada</span>
      </motion.div>
    </div>
  );
};
