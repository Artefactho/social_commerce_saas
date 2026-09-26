import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  included_template_id: string | null;
}

// Nomes oficiais dos planos: VISAO_E_MODELO_DE_NEGOCIO.md seção 4 (BÁSICO /
// PRO / MASTER). A tabela `plans` real hoje só guarda name/price/
// included_template_id — sem uma lista de "recursos" por plano — então esta
// lista serve só de apresentação (copy de marketing), indexada pelo nome
// real vindo do banco. Um nome de plano que não bater com nenhuma entrada
// aqui cai no fallback genérico abaixo, sem quebrar a página.
// ASSUMPTION (baixo impacto, reversível): preços de exemplo usados no seed
// local (R$49/99/199) espelham os mesmos valores já usados na seção
// "Preços" da landing (que usava os nomes antigos START/PRO/MASTER) — não é
// uma decisão de precificação real do produto, só dado de demonstração.
const FEATURES_BY_PLAN_NAME: Record<string, string[]> = {
  "BÁSICO": ["Até 50 produtos", "Domínio próprio", "Suporte via chat"],
  "PRO": ["Produtos ilimitados", "Relatórios avançados", "Faturamento ilimitado", "Personalização total"],
  "MASTER": ["Tudo no PRO", "Checkout personalizado", "API de integração", "Gerente de conta"],
};
const DEFAULT_FEATURES = ["Loja online completa", "Catálogo de produtos", "Checkout com Pix"];

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Planos = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });
      if (!error && data) setPlans(data);
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tighter uppercase">SAAS COMMERCE</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Planos para o seu negócio</h1>
          <p className="text-muted-foreground">
            Escolha o plano que acompanha o seu momento. Sem contrato de fidelidade.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 text-muted-foreground">
            <p>Nenhum plano disponível no momento. Volte em breve.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => {
              const isPopular = i === 1 && plans.length >= 2;
              const features = FEATURES_BY_PLAN_NAME[plan.name.toUpperCase()] || DEFAULT_FEATURES;
              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-[2rem] border flex flex-col ${
                    isPopular ? "border-primary ring-1 ring-primary bg-primary/5 relative" : "border-border bg-card"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      MAIS POPULAR
                    </div>
                  )}
                  <h4 className="font-heading text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-8">
                    <span className="text-4xl font-bold">R$ {formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <div className="space-y-4 mb-8 flex-1">
                    {features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 size={16} className="text-primary shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className={isPopular ? "btn-premium" : ""} variant={isPopular ? "default" : "outline"} asChild>
                    <Link to="/signup">COMEÇAR AGORA</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Planos;
