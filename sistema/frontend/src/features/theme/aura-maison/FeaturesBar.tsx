import { Truck, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

// Genérico e válido para qualquer loja — nenhum valor numérico fixo (frete,
// parcelas, prazo) que não venha de configuração real da loja.
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
            className="bg-[#FAF6F0] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E8DFCF] shadow-sm hover:shadow-md hover:border-[#D8CCB8] transition-all duration-300 flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#F0E6D5] flex items-center justify-center shrink-0 border border-[#DFD3C0]">
              <f.icon className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-stone-900 leading-snug">{f.title}</h4>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
