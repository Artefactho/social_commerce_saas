import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  ExternalLink, 
  Plus, 
  Search,
  TrendingUp,
  Users,
  DollarSign,
  LogOut,
  Loader2,
  Palette,
  Check,
  Eye,
  Trash2,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProductModal } from "@/components/ProductModal";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path;
  };

  const fetchProducts = async (storeId: string) => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const productsWithUrls = await Promise.all((data || []).map(async (product) => {
        if (product.image_url && !product.image_url.startsWith('http')) {
          const { data: signedUrlData } = await supabase.storage
            .from("products")
            .createSignedUrl(product.image_url, 31536000); // 1 year
          
          return {
            ...product,
            image_url: signedUrlData?.signedUrl || product.image_url
          };
        }
        return product;
      }));

      setRecentProducts(productsWithUrls);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchOrders = async (storeId: string) => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    const fetchStore = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Erro ao carregar loja");
      } else if (!data) {
        navigate("/onboarding");
      } else {
        setStore(data);
        fetchProducts(data.id);
        fetchOrders(data.id);
      }
      setIsLoading(false);
    };

    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("active", true);
      if (data) setDbTemplates(data);
    };

    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });
      if (data) setPlans(data);
    };

    fetchStore();
    fetchTemplates();
    fetchPlans();
  }, [navigate]);

  const handleUpdateTemplate = async (templateId: string) => {
    if (templateId === store.active_template_id) return;
    
    setIsUpdatingTemplate(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({ active_template_id: templateId })
        .eq("id", store.id);
      
      if (error) throw error;
      
      setStore(prev => ({ ...prev, active_template_id: templateId }));
      toast.success("Template atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar template");
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  const handleUpdatePlan = async (plan: any) => {
    if (plan.id === store.plan_id) return;
    
    setIsUpdatingPlan(true);
    try {
      // 1. Update store plan
      const { error: storeError } = await supabase
        .from("stores")
        .update({ 
          plan_id: plan.id,
          active_template_id: plan.included_template_id
        })
        .eq("id", store.id);
      
      if (storeError) throw storeError;

      // 2. Ensure template is in store_templates
      const { data: existingTemplate } = await supabase
        .from("store_templates")
        .select("*")
        .eq("store_id", store.id)
        .eq("template_id", plan.included_template_id)
        .maybeSingle();

      if (!existingTemplate) {
        await supabase.from("store_templates").insert({
          store_id: store.id,
          template_id: plan.included_template_id
        });
      }
      
      setStore(prev => ({ 
        ...prev, 
        plan_id: plan.id, 
        active_template_id: plan.included_template_id 
      }));
      toast.success(`Plano ${plan.name} ativado com sucesso!`);
    } catch (error: any) {
      toast.error("Erro ao atualizar plano");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado");
      navigate("/login");
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Produto excluído!");
      fetchProducts(store.id);
    } catch (error: any) {
      toast.error("Erro ao excluir produto");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background hero-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

  const stats = [
    { title: "Vendas Totais", value: `R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, trend: "0%" },
    { title: "Pedidos", value: orders.length.toString(), icon: ShoppingCart, trend: "0%" },
    { title: "Visitantes", value: "0", icon: Users, trend: "0%" },
    { title: "Conversão", value: "0%", icon: TrendingUp, trend: "0%" },
  ];

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold">Seller Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
            { id: "products", label: "Produtos", icon: Package },
            { id: "orders", label: "Pedidos", icon: ShoppingCart },
            { id: "plans", label: "Assinatura", icon: DollarSign },
            { id: "appearance", label: "Aparência", icon: Palette },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive transition-colors" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <a href={`/store/${store?.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />
              Ir Para Loja
            </a>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Bem-vindo à {store?.name}!</h1>
            <p className="text-muted-foreground">Aqui está o que está acontecendo na sua loja hoje.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-10" />
            </div>
            <Button variant="outline" className="shrink-0 gap-2" asChild>
              <a href={`/store/${store?.slug}`} target="_blank" rel="noreferrer">
                <Eye className="w-4 h-4" />
                Ver Minha Loja
              </a>
            </Button>
            <Button className="btn-premium shrink-0" onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={stat.title}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <stat.icon className="w-4 h-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-green-500 font-medium mt-1">{stat.trend} em relação ao mês passado</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Products */}
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Produtos Recentes</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("products")}>Ver todos</Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-sm text-muted-foreground">
                          <th className="pb-4 font-medium">Produto</th>
                          <th className="pb-4 font-medium">Preço</th>
                          <th className="pb-4 font-medium">Estoque</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentProducts.map((product) => (
                          <tr key={product.id} className="group">
                            <td className="py-4 font-medium flex items-center gap-3">
                              {product.image_url ? (
                                <img 
                                  src={getImageUrl(product.image_url)} 
                                  className="w-10 h-10 rounded object-cover border" 
                                  alt="" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              {product.name}
                            </td>
                            <td className="py-4">R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                            <td className="py-4">{product.stock_quantity} un.</td>
                            <td className="py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                product.status === "Ativo" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                              }`}>
                                {product.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!isLoadingProducts && recentProducts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              Nenhum produto cadastrado ainda.
                            </td>
                          </tr>
                        )}
                        {isLoadingProducts && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-heading font-bold">Assinatura do Plano</h2>
                <p className="text-muted-foreground text-sm">
                  Sua loja está em modo 
                  {store.plan_id ? " ativo" : ` trial (termina em ${new Date(store.trial_ends_at).toLocaleDateString("pt-BR")})`}.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      store.plan_id === plan.id 
                        ? "ring-2 ring-primary shadow-xl scale-105" 
                        : "hover:shadow-lg opacity-90 hover:opacity-100"
                    }`}
                  >
                    {store.plan_id === plan.id && (
                      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                        Atual
                      </div>
                    )}
                    <CardHeader className="text-center pb-8 border-b bg-secondary/20">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">PLANO</CardTitle>
                      <div className="text-4xl font-heading font-bold mb-1">{plan.name}</div>
                      <div className="text-2xl font-bold text-primary">R$ {plan.price} <span className="text-sm text-muted-foreground font-medium">/mês</span></div>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Template {plan.name === 'START' ? 'Minimal' : plan.name === 'PRO' ? 'Bold' : 'Premium'} incluso</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Painel do Vendedor Completo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Produtos Ilimitados</span>
                        </div>
                      </div>
                      <Button 
                        className={`w-full h-12 font-bold ${store.plan_id === plan.id ? 'btn-premium' : ''}`}
                        variant={store.plan_id === plan.id ? "default" : "outline"}
                        disabled={isUpdatingPlan || store.plan_id === plan.id}
                        onClick={() => handleUpdatePlan(plan)}
                      >
                        {isUpdatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : store.plan_id === plan.id ? "PLANO ATIVO" : "ESCOLHER PLANO"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold">Personalização Visual</h2>
                  <p className="text-muted-foreground text-sm">Escolha como sua loja é apresentada ao mundo.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {dbTemplates.map((t) => (
                  <Card 
                    key={t.id}
                    className={`overflow-hidden transition-all duration-300 ${
                      store.active_template_id === t.id 
                        ? "ring-2 ring-primary shadow-xl" 
                        : "hover:shadow-lg opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="aspect-[4/5] relative group">
                      <img 
                        src={t.thumbnail_url} 
                        alt={t.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center text-white">
                        <p className="text-sm mb-4 line-clamp-3">{t.description}</p>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="w-full mb-2"
                          onClick={() => window.open(t.preview_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Demo
                        </Button>
                        {store.active_template_id !== t.id && (
                          <Button 
                            className="w-full"
                            onClick={() => handleUpdateTemplate(t.id)}
                            disabled={isUpdatingTemplate}
                          >
                            {isUpdatingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar Template"}
                          </Button>
                        )}
                      </div>
                      
                      {store.active_template_id === t.id && (
                        <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2">
                          <Check className="w-3 h-3" />
                          Ativo
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Todos os Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-sm text-muted-foreground">
                          <th className="pb-4 font-medium">Cliente</th>
                          <th className="pb-4 font-medium">Data</th>
                          <th className="pb-4 font-medium">Total</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.id} className="group">
                            <td className="py-4">
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="py-4 font-medium">R$ {Number(order.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                order.status === "pending" ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-500"
                              }`}>
                                {order.status === "pending" ? "Pendente" : "Pago"}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground capitalize">
                              {order.payment_method?.replace("_", " ") || "N/A"}
                            </td>
                          </tr>
                        ))}
                        {!isLoadingOrders && orders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              Nenhum pedido recebido ainda.
                            </td>
                          </tr>
                        )}
                        {isLoadingOrders && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab !== "overview" && activeTab !== "appearance" && activeTab !== "orders" && (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground glass rounded-3xl">
              <p className="text-lg">Esta funcionalidade ({activeTab}) está em desenvolvimento.</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      <ProductModal 
        isOpen={isProductModalOpen} 
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        storeId={store?.id}
        storeSlug={store?.slug}
        onSuccess={() => fetchProducts(store.id)}
        product={editingProduct}
      />
    </div>
  );
};

export default Dashboard;
