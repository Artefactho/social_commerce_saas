import { Truck, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

// Mesmo conteúdo genérico do FeaturesBar do Aura Maison — nenhum valor
// numérico fixo (frete, parcelas, prazo) que não venha de configuração real
// da loja, válido para qualquer nicho.
const FEATURES = [
  { icon: Truck, title: "Frete no Checkout", description: "Calculado com base no seu endereço." },
  { icon: CreditCard, title: "Pagamento Seguro", description: "Pix ou cartão, com dados protegidos." },
  { icon: RefreshCw, title: "Troca Facilitada", description: "Fale com a loja em caso de problema." },
  { icon: ShieldCheck, title: "Compra Protegida", description: "Pedido registrado do início ao fim." },
];

export const FeaturesBar = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="bg-[#0e0e12] p-4 sm:p-5 rounded-2xl border border-[rgba(229,184,105,0.16)] hover:border-[#e5b869] transition-all duration-300 flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-full bg-[#14141a] flex items-center justify-center shrink-0 border border-[rgba(229,184,105,0.28)]">
              <f.icon className="w-5 h-5 text-[#e5b869]" />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-white leading-snug">{f.title}</h4>
              <p className="text-xs text-[#8c8c9a] mt-0.5 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
