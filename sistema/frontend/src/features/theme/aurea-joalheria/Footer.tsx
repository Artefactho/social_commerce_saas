import { ThemeCategory } from "./Header";

interface FooterProps {
  storeName: string;
  categories: ThemeCategory[];
  onSelectCategory: (categoryName: string) => void;
}

// Mesma decisão de escopo do Footer do Aura Maison: propositalmente simples
// e genérico — sem CNPJ fictício, sem newsletter decorativa, sem
// WhatsApp/Instagram (stores.whatsapp_number/instagram ainda não existem no
// schema). Ver PROGRESS.md "FASE 4.1".
export const Footer: React.FC<FooterProps> = ({ storeName, categories, onSelectCategory }) => {
  return (
    <footer className="bg-black text-[#8c8c9a] py-12 px-4 sm:px-6 lg:px-8 mt-8 border-t border-[rgba(229,184,105,0.16)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <span className="font-heading text-lg font-bold text-white tracking-[0.2em] uppercase">{storeName}</span>
          <p className="text-xs text-[#8c8c9a] mt-2 max-w-xs leading-relaxed">
            Peças selecionadas com cuidado, prontas para você.
          </p>
        </div>

        {categories.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#e5b869] font-bold mb-3">Categorias</h4>
            <ul className="space-y-1.5 text-xs">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.name);
                      document.getElementById("catalogo-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-[#e5b869] transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto border-t border-[rgba(229,184,105,0.16)] mt-8 pt-6 text-[11px] text-[#8c8c9a] text-center">
        © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
      </div>
    </footer>
  );
};
