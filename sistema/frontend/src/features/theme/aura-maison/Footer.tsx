import { ThemeCategory } from "./Header";

interface FooterProps {
  storeName: string;
  categories: ThemeCategory[];
  onSelectCategory: (categoryName: string) => void;
}

// ASSUMPTION: rodapé propositalmente simples/genérico nesta fatia da Fase 4
// (decisão do usuário) — sem CNPJ fictício, sem newsletter decorativa, sem
// WhatsApp/Instagram (stores.whatsapp_number/instagram ainda não existem no
// schema). Ver PROGRESS.md "FASE 4.1" para o escopo completo de rodapé.
// Baixo impacto, reversível.
export const Footer: React.FC<FooterProps> = ({ storeName, categories, onSelectCategory }) => {
  return (
    <footer className="bg-[#1F1C19] text-[#D8D2C6] py-12 px-4 sm:px-6 lg:px-8 mt-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <span className="font-heading text-xl font-bold text-white tracking-wide">{storeName}</span>
          <p className="text-xs text-[#A89F91] mt-2 max-w-xs leading-relaxed">
            Produtos selecionados com cuidado, prontos para você.
          </p>
        </div>

        {categories.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#A89F91] font-bold mb-3">Categorias</h4>
            <ul className="space-y-1.5 text-xs">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.name);
                      document.getElementById("catalogo-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 pt-6 text-[11px] text-[#807A6D] text-center">
        © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
      </div>
    </footer>
  );
};
