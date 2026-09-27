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
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { createSecureOrder } from "@/services/order/OrderService";
import { 
  buildWhatsAppLink, 
  buildCartWhatsAppMessage, 
  buildOrderWhatsAppMessage 
} from "@/utils/whatsapp";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, storeSlug: cartStoreSlug, clearCart } = useCart();
  const [step, setStep] = useState<"cart" | "shipping" | "payment" | "pix_waiting" | "success">("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    zip: "",
    address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    const fetchStoreDetails = async (slugToFetch: string) => {
      if (!slugToFetch) return;
      const { data: storeRow } = await supabase
        .from("stores")
        .select("id, slug, name, shipping_fee")
        .eq("slug", slugToFetch)
        .maybeSingle();

      if (storeRow) {
        const { data: themeConfigRow } = await supabase
          .from("store_theme_configs")
          .select("config")
          .eq("store_id", storeRow.id)
          .maybeSingle();

        const config = (themeConfigRow?.config as any) || null;
        setStoreData({
          ...storeRow,
          whatsapp: config?.social?.whatsapp || null,
          whatsappMessage: config?.social?.whatsappMessage || null,
        });
      }
    };
    fetchStoreDetails(cartStoreSlug || "");
  }, [cartStoreSlug]);

  // Polling de Confirmação do Pagamento Pix
  useEffect(() => {
    let interval: any = null;
    if (step === "pix_waiting" && createdOrder?.orderId) {
      interval = setInterval(async () => {
        try {
          const { data } = await supabase.functions.invoke("check-order-status", {
            headers: { "Content-Type": "application/json" },
            body: {},
          });

          // Se a function retornar is_paid ou se a consulta no banco indicar paid
          if (data?.is_paid) {
            clearInterval(interval);
            toast.success("Pagamento confirmado com sucesso!");
            setStep("success");
            return;
          }

          // Fallback via consulta direta segura
          const { data: orderRow } = await supabase
            .from("orders")
            .select("status")
            .eq("id", createdOrder.orderId)
            .single();

          if (orderRow?.status === "paid") {
            clearInterval(interval);
            toast.success("Pagamento confirmado com sucesso!");
            setStep("success");
          }
        } catch {
          // Polling silencioso
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, createdOrder]);

  const subtotal = getSubtotal();
  const hasPhysicalItem = items.some((item) => item.product.product_type !== "digital");
  const shipping = hasPhysicalItem ? (storeData?.shipping_fee || 0) : 0;
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? subtotal * (Number(appliedCoupon.discount_value) / 100)
      : Math.min(Number(appliedCoupon.discount_value), subtotal)
    : 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  // Geração de Links de WhatsApp seguros e escopados pelo Tenant
  const cartWhatsAppLink = storeData?.whatsapp ? buildWhatsAppLink({
    phone: storeData.whatsapp,
    message: buildCartWhatsAppMessage({
      storeName: storeData.name || "Minha Loja",
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        product_type: item.product.product_type,
      })),
      subtotal,
      shipping,
      discount,
      couponCode: appliedCoupon?.code,
    }),
  }) : null;

  const orderWhatsAppLink = (storeData?.whatsapp && createdOrder?.orderId) ? buildWhatsAppLink({
    phone: storeData.whatsapp,
    message: buildOrderWhatsAppMessage({
      storeName: storeData.name || "Minha Loja",
      orderId: createdOrder.orderId,
      totalAmount: createdOrder.totalAmount || total,
      paymentMethod,
    }),
  }) : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !storeData?.id) return;
    setIsApplyingCoupon(true);
    try {
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

  const handleCopyPix = () => {
    if (!createdOrder?.payment?.pixCopyPaste) return;
    navigator.clipboard.writeText(createdOrder.payment.pixCopyPaste);
    setCopiedPix(true);
    toast.success("Código Pix copiado para a área de transferência!");
    setTimeout(() => setCopiedPix(false), 3000);
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
      if (!storeData?.id) {
        toast.error("Loja não identificada. Recarregue a página.");
        return;
      }
      setIsProcessing(true);
      try {
        const orderResult = await createSecureOrder({
          storeId: storeData.id,
          customer: formData,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code,
          paymentMethod: paymentMethod,
        });

        if (orderResult.success) {
          setCreatedOrder(orderResult);
          clearCart();
          if (paymentMethod === "pix" && orderResult.payment?.pixCopyPaste) {
            setStep("pix_waiting");
          } else {
            setStep("success");
          }
        } else {
          toast.error("Não foi possível processar seu pedido.");
        }
      } catch (error: any) {
        console.error("Order error:", error);
        toast.error(error.message || "Erro ao processar o pedido. Tente novamente.");
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
          <h1 className="text-3xl font-heading font-bold" id="order-success-title">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu pedido <span className="font-mono font-bold text-foreground">#{createdOrder?.orderId?.substring(0, 8)}</span> foi aprovado e já está sendo preparado pela loja.
          </p>

          <div className="space-y-3">
            {orderWhatsAppLink && (
              <a 
                href={orderWhatsAppLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
                id="whatsapp-order-success-btn"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Acompanhar Pedido pelo WhatsApp</span>
              </a>
            )}
            <Button className="w-full h-12 btn-premium" asChild>
              <Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"} id="success-home-link">Voltar para a Loja</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "pix_waiting") {
    const pixData = createdOrder?.payment;
    const qrSrc = pixData?.pixQrCodeBase64
      ? pixData.pixQrCodeBase64.startsWith("data:")
        ? pixData.pixQrCodeBase64
        : `data:image/png;base64,${pixData.pixQrCodeBase64}`
      : null;

    return (
      <div className="min-h-screen bg-secondary/20 pb-20">
        <header className="bg-background border-b h-16 flex items-center px-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"} className="flex items-center gap-2 font-heading font-bold uppercase tracking-tight">
              <ShoppingBag className="w-5 h-5" />
              Minha Loja
            </Link>
            <span className="text-xs font-bold text-primary">AGUARDANDO PAGAMENTO</span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-3xl space-y-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg">
              <QrCode className="w-6 h-6" />
              <span>Pague com Pix</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Abra o app do seu banco, escolha <strong>Pagar com Pix</strong> e aponte a câmera para o QR Code abaixo ou use o código Copia e Cola.
            </p>

            {qrSrc && (
              <div className="bg-white p-4 rounded-2xl w-56 h-56 mx-auto flex items-center justify-center shadow-lg border">
                <img src={qrSrc} alt="QR Code Pix" className="w-full h-full object-contain" id="pix-qr-image" />
              </div>
            )}

            <div className="text-2xl font-bold text-foreground">
              R$ {createdOrder?.totalAmount?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {pixData?.pixCopyPaste && (
              <div className="space-y-2 text-left">
                <Label className="text-xs text-muted-foreground">Código Pix Copia e Cola:</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={pixData.pixCopyPaste} 
                    className="font-mono text-xs bg-secondary/50 select-all"
                    id="pix-copy-paste-input"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCopyPix}
                    className="shrink-0 flex items-center gap-1.5"
                    id="pix-copy-btn"
                  >
                    {copiedPix ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPix ? "Copiado" : "Copiar"}</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center gap-3 text-xs text-primary font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Aguardando confirmação do pagamento...</span>
            </div>

            <div className="space-y-2 pt-2">
              {orderWhatsAppLink && (
                <a
                  href={orderWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm"
                  id="whatsapp-pix-contact-btn"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar no WhatsApp / Enviar Comprovante</span>
                </a>
              )}

              <Button variant="ghost" className="w-full text-xs text-muted-foreground" asChild>
                <Link to={storeData?.slug ? `/store/${storeData.slug}` : "/"}>Voltar para a loja e pagar depois</Link>
              </Button>
            </div>
          </motion.div>
        </main>
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
                    <Label>CPF</Label>
                    <Input name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input name="zip" value={formData.zip} onChange={handleInputChange} placeholder="00000-000" />
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
                  defaultValue="pix" 
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid gap-4"
                >
                  <Label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="pix" />
                      <div className="flex items-center gap-3">
                        <QrCode className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-bold">PIX (Mercado Pago)</p>
                          <p className="text-xs text-muted-foreground">Aprovação instantânea e segura</p>
                        </div>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
                
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p>Pagamento 100% seguro processado diretamente via Mercado Pago.</p>
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
                step === "cart" ? "IR PARA ENTREGA" : step === "shipping" ? "IR PARA PAGAMENTO" : "GERAR PIX"
              )}
            </Button>

            {cartWhatsAppLink && items.length > 0 && (
              <a
                href={cartWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider transition-colors"
                id="whatsapp-checkout-support-btn"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Finalizar ou Tirar Dúvidas no WhatsApp</span>
              </a>
            )}
            
            {step !== "cart" && (
              <Button 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => setStep(step === "shipping" ? "cart" : "shipping")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;