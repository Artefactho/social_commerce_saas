import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck,
  CreditCard,
  QrCode,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, storeSlug: cartStoreSlug, clearCart } = useCart();
  const [step, setStep] = useState("cart"); // cart, shipping, payment, success
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    zip: "",
    address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const fetchStoreShipping = async (slugToFetch: string) => {
      if (!slugToFetch) return;
      const { data } = await supabase
        .from("stores")
        .select("id, slug, shipping_fee")
        .eq("slug", slugToFetch)
        .single();
      if (data) setStoreData(data);
    };
    fetchStoreShipping(cartStoreSlug || "");
  }, [cartStoreSlug]);

  const subtotal = getSubtotal();
  // Regra inegociável #2 (CLAUDE.md): frete nunca se aplica a produto
  // digital. Um carrinho só com produtos digitais nunca cobra/exibe frete.
  const hasPhysicalItem = items.some((item) => item.product.product_type !== "digital");
  const shipping = hasPhysicalItem ? (storeData?.shipping_fee || 0) : 0;
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? subtotal * (Number(appliedCoupon.discount_value) / 100)
      : Math.min(Number(appliedCoupon.discount_value), subtotal)
    : 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !storeData?.id) return;
    setIsApplyingCoupon(true);
    try {
      // Sempre escopado por store_id + code: um cupom da Loja A nunca é
      // encontrado (e portanto nunca aceito) checando o carrinho da Loja B.
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("code", couponCode.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Cupom inválido ou expirado para esta loja.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      toast.success("Cupom aplicado!");
    } catch (error: any) {
      toast.error("Erro ao validar cupom.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (step === "cart") {
      setStep("shipping");
    } else if (step === "shipping") {
      if (!formData.name || !formData.email || !formData.address) {
        toast.error("Por favor, preencha os campos obrigatórios.");
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      setIsProcessing(true);
      try {
        // 1. Create order
        // Generate a random UUID for the order client-side to associate items
        const orderId = crypto.randomUUID();
        
        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            id: orderId,
            store_id: storeData.id,
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            shipping_address: `${formData.address}${formData.zip ? `, CEP: ${formData.zip}` : ""}`,
            total_amount: total,
            payment_method: paymentMethod,
            status: "pending"
          });

        if (orderError) throw orderError;

        // 2. Create order items
        const orderItems = items.map(item => ({
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        toast.success("Pedido realizado com sucesso!");
        clearCart();
        setStep("success");
      } catch (error: any) {
        console.error("Order error:", error);
        toast.error("Erro ao processar o pedido. Tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-heading font-bold" id="order-success-title">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">Obrigado por sua compra. Você receberá um e-mail com os detalhes do rastreio em breve.</p>
          <Button className="w-full h-12 btn-premium" asChild>
            <Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"} id="success-home-link">Voltar para a Loja</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 pb-20">
      <header className="bg-background border-b h-16 flex items-center px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"} className="flex items-center gap-2 font-heading font-bold uppercase tracking-tight">
            <ShoppingBag className="w-5 h-5" />
            Minha Loja
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className={step === "cart" ? "text-primary" : ""}>CARRINHO</span>
            <span className="opacity-30">/</span>
            <span className={step === "shipping" ? "text-primary" : ""}>ENTREGA</span>
            <span className="opacity-30">/</span>
            <span className={step === "payment" ? "text-primary" : ""}>PAGAMENTO</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {step === "cart" && (
              <motion.div 
                key="cart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-heading font-bold">Seu Carrinho</h2>
                {items.length === 0 ? (
                  <div className="glass p-12 text-center space-y-4 rounded-3xl">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">Seu carrinho está vazio.</p>
                    <Button asChild><Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"}>Continuar Comprando</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="glass p-4 rounded-2xl flex gap-4 items-center">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-20 h-20 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-bold text-sm sm:text-base">{item.product.name}</h3>
                          <p className="text-primary font-bold">R$ {item.product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 hover:bg-secondary rounded-md"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 hover:bg-secondary rounded-md"><Plus className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => removeItem(item.product.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.div 
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass p-8 rounded-3xl space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold">Dados de Entrega</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input name="zip" value={formData.zip} onChange={handleInputChange} placeholder="00000-000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Endereço Completo *</Label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Rua, número, complemento" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass p-8 rounded-3xl space-y-6"
              >
                <h2 className="text-2xl font-heading font-bold">Forma de Pagamento</h2>
                <RadioGroup 
                  defaultValue="credit_card" 
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid gap-4"
                >
                  <Label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="credit_card" />
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-bold">Cartão de Crédito</p>
                          <p className="text-xs text-muted-foreground">Até 12x sem juros</p>
                        </div>
                      </div>
                    </div>
                  </Label>
                  <Label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="pix" />
                      <div className="flex items-center gap-3">
                        <QrCode className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-bold">PIX</p>
                          <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
                        </div>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
                
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p>Pagamento 100% seguro processado por nossa plataforma.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl sticky top-24">
            <h3 className="text-xl font-heading font-bold mb-6">Resumo do Pedido</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Cupom de desconto"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!appliedCoupon}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !!appliedCoupon || !couponCode.trim()}
              >
                {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : appliedCoupon ? "Aplicado" : "Aplicar"}
              </Button>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {hasPhysicalItem && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>R$ {shipping.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Cupom ({appliedCoupon.code})</span>
                  <span>- R$ {discount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Button
              className="w-full h-14 text-base font-bold btn-premium" 
              onClick={handleCheckout}
              disabled={items.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                step === "cart" ? "IR PARA ENTREGA" : step === "shipping" ? "IR PARA PAGAMENTO" : "FINALIZAR COMPRA"
              )}
            </Button>
            
            {step !== "cart" && (
              <Button 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => setStep(step === "shipping" ? "cart" : "shipping")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            ) }
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;