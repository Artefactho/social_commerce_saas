import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, ArrowLeft, Check, Layout, Palette, Package, Globe, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, title: "Nome da Loja", icon: Layout },
  { id: 2, title: "Categoria", icon: Package },
  { id: 3, title: "Visual", icon: Palette },
  { id: 4, title: "Publicar", icon: Globe },
];

// templates.layout_key -> themeId do Theme Contract (PublicStore.tsx).
const THEME_ID_BY_LAYOUT_KEY: Record<string, string> = {
  "jo-perfumes": "jo-perfumes",
  premium: "aura-maison",
  "aurea-joalheria": "aurea-joalheria",
  minimal: "aura-maison",
};

export const DEFAULT_TEMPLATES = [
  {
    id: "44444444-0000-0000-0000-000000000000",
    name: "Jô Perfumes & Cosméticos",
    layout_key: "jo-perfumes",
    active: true,
    description: "Tema estilo Instagram Shop com Stories em destaque, Bio de perfil verificada, Hero Carousel e Bottom Nav mobile.",
    thumbnail_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
    preview_url: "/store/demo-jo-perfumes",
  },
  {
    id: "44444444-0000-0000-0000-000000000001",
    name: "Aura Maison",
    layout_key: "premium",
    active: true,
    description: "Tema oficial de luxo, com catálogo sofisticado, carrinho e favoritos adaptados aos seus produtos.",
    thumbnail_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    preview_url: "/store/demo-aura-maison",
  },
  {
    id: "44444444-0000-0000-0000-000000000002",
    name: "Aurea Joalheria",
    layout_key: "aurea-joalheria",
    active: true,
    description: "Tema em tons de ônix e dourado com tipografia serifada de alta conversão.",
    thumbnail_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    preview_url: "/store/demo-aurea-joalheria",
  },
  {
    id: "44444444-0000-0000-0000-000000000003",
    name: "Minimal Clean",
    layout_key: "minimal",
    active: true,
    description: "Design moderno e minimalista com foco total na apresentação dos produtos.",
    thumbnail_url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80",
    preview_url: "/store/demo-minimal",
  },
];

const categories = [
  { id: "Fashion", label: "Moda & Vestuário", desc: "Roupas, calçados, bolsas e joias", icon: "👗" },
  { id: "Beauty", label: "Beleza & Cosméticos", desc: "Perfumes, maquiagem e skincare", icon: "✨" },
  { id: "Food", label: "Alimentos & Bebidas", desc: "Doces artesanais, lanches e bebidas", icon: "☕" },
  { id: "Electronics", label: "Eletrônicos & Tech", desc: "Gadgets, smartphones e informática", icon: "📱" },
  { id: "Personal", label: "Casa & Cuidados", desc: "Decoração, saúde e bem-estar", icon: "🌿" },
  { id: "Other", label: "Outros Segmentos", desc: "Variedades, artes e serviços", icon: "🛍️" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStore, setIsCheckingStore] = useState(true);
  const [dbTemplates, setDbTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [formData, setFormData] = useState({
    name: "",
    category: "Fashion",
    templateId: DEFAULT_TEMPLATES[0].id,
    slug: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingStore = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: stores, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id);

      if (stores && stores.length > 0) {
        toast.info("Você já possui uma loja configurada.");
        navigate("/dashboard");
      }
      setIsCheckingStore(false);
    };

    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("active", true);
        
        if (data && data.length > 0) {
          setDbTemplates(data);
          setFormData((prev) => ({
            ...prev,
            templateId: prev.templateId || data[0].id,
          }));
        } else {
          setDbTemplates(DEFAULT_TEMPLATES);
          setFormData((prev) => ({
            ...prev,
            templateId: prev.templateId || DEFAULT_TEMPLATES[0].id,
          }));
        }
      } catch (err) {
        setDbTemplates(DEFAULT_TEMPLATES);
      }
    };

    checkExistingStore();
    fetchTemplates();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep === 1 && (!formData.name || !formData.slug)) {
      toast.error("Por favor, informe o nome e o link da sua loja.");
      return;
    }
    if (currentStep === 3 && !formData.templateId) {
      toast.error("Por favor, escolha um tema para a sua loja.");
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Validar se o slug é único
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", formData.slug)
        .maybeSingle();

      if (existingStore) {
        setCurrentStep(1); // Volta para o primeiro passo para o usuário corrigir o slug
        toast.error("Este link já está em uso. Por favor, escolha outro.");
        setIsLoading(false);
        return;
      }

      // Toda loja pertence a uma organização. Tenta criar via RPC ou obter existente.
      let orgId: string | null = null;
      try {
        const { data: orgData, error: orgError } = await supabase
          .rpc("create_organization", { _name: formData.name })
          .single();

        if (!orgError && orgData?.id) {
          orgId = orgData.id;
        }
      } catch (e) {
        console.warn("create_organization RPC fallback:", e);
      }

      // Se RPC falhar, tenta buscar organização em que o usuário seja membro
      if (!orgId) {
        const { data: userOrgs } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1);

        if (userOrgs && userOrgs.length > 0) {
          orgId = userOrgs[0].organization_id;
        }
      }

      let storePayload: any = {
        owner_id: user.id,
        name: formData.name,
        slug: formData.slug,
        category: formData.category as any,
      };

      if (orgId) {
        storePayload.organization_id = orgId;
      }

      // Se templateId estiver no banco, inclui
      const isRemoteTemplate = dbTemplates.some(
        (t) => t.id === formData.templateId && t.id !== "44444444-0000-0000-0000-000000000001" && t.id !== "44444444-0000-0000-0000-000000000002" && t.id !== "44444444-0000-0000-0000-000000000003"
      );
      if (isRemoteTemplate) {
        storePayload.active_template_id = formData.templateId;
      }

      let storeData: any = null;
      const { data: insertedStore, error: storeError } = await supabase
        .from("stores")
        .insert(storePayload)
        .select()
        .single();

      if (storeError) {
        // Fallback se faltou organization_id ou active_template_id
        delete storePayload.active_template_id;
        const retry = await supabase.from("stores").insert(storePayload).select().single();
        if (retry.error) throw retry.error;
        storeData = retry.data;
      } else {
        storeData = insertedStore;
      }

      // Associar template à loja se aplicável
      if (isRemoteTemplate && storeData?.id) {
        try {
          await supabase.from("store_templates").insert({
            store_id: storeData.id,
            template_id: formData.templateId,
            acquired_via: "onboarding",
          });
        } catch (e) {
          console.warn("store_templates insert non-blocking:", e);
        }
      }

      // Ativa o Theme Contract real
      const chosenLayoutKey = dbTemplates.find((t) => t.id === formData.templateId)?.layout_key || "premium";
      const themeId = chosenLayoutKey ? THEME_ID_BY_LAYOUT_KEY[chosenLayoutKey] || "aura-maison" : "aura-maison";
      try {
        await supabase
          .from("store_theme_configs")
          .upsert({ store_id: storeData.id, config: { themeId } }, { onConflict: "store_id" });
      } catch (e) {
        console.warn("store_theme_configs fallback:", e);
      }

      toast.success("Loja criada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar loja");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b px-4 h-16 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold">SAAS COMMERCE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
            Passo {currentStep} de {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s.id <= currentStep ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-3xl p-8 md:p-12 shadow-xl"
            >
              <div className="mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {(() => {
                    const Icon = steps[currentStep - 1].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <h2 className="text-3xl font-heading mb-2">{steps[currentStep - 1].title}</h2>
                <p className="text-muted-foreground">Vamos configurar os detalhes iniciais do seu negócio.</p>
              </div>

              <div className="min-h-[200px] flex flex-col justify-center">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="store-name">Como sua loja vai se chamar?</Label>
                      <Input
                        id="store-name"
                        placeholder="Ex: Minha Boutique Incrível"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-14 text-lg"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store-slug">Qual será o link da sua loja?</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">minhaloja.com/</span>
                        <Input
                          id="store-slug"
                          placeholder="nome-da-loja"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className="h-14 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xl font-heading">Qual a categoria do seu negócio?</Label>
                      <p className="text-sm text-muted-foreground">Selecione o segmento principal para personalizar a experiência da sua loja.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {categories.map((cat) => (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            formData.category === cat.id
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                              : "bg-background/80 hover:border-primary/50 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="text-2xl">{cat.icon}</div>
                          <div>
                            <div className="font-bold text-sm tracking-tight">{cat.label}</div>
                            <div
                              className={`text-xs mt-0.5 leading-snug ${
                                formData.category === cat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              {cat.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-xl font-heading">Escolha a identidade da sua loja</Label>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {dbTemplates.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setFormData({ ...formData, templateId: t.id })}
                          className={`group relative flex flex-col rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-300 ${
                            formData.templateId === t.id
                              ? "border-primary ring-4 ring-primary/10 shadow-xl scale-[1.02]"
                              : "border-muted-foreground/30 bg-secondary/50 hover:border-primary/30 hover:shadow-lg"
                          }`}
                        >
                          {/* Visual Thumbnail — fallback gracioso quando o template
                              ainda não tem thumbnail_url cadastrado (evita <img> com
                              src vazio, que renderiza quebrado) */}
                          <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                            {t.thumbnail_url ? (
                              <img
                                src={t.thumbnail_url}
                                alt={t.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                                <Layout className="w-10 h-10 text-primary/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                            {/* Selected Indicator */}
                            {formData.templateId === t.id && (
                              <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                <Check className="w-5 h-5 text-primary-foreground" />
                              </div>
                            )}

                            {/* Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                              <h4 className="text-xl font-bold mb-1 tracking-tight">{t.name}</h4>
                              <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{t.description}</p>
                            </div>

                            {/* Preview Button */}
                            {t.preview_url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(t.preview_url, '_blank');
                                }}
                                className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/75 hover:bg-black/95 text-white backdrop-blur-md rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all hover:scale-105 border border-white/20"
                                title="Ver Demonstração da Loja ao Vivo"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                                <span>Ver Demo</span>
                              </button>
                            )}
                          </div>
                          
                          {/* Layout Features Badge */}
                          <div className="p-3 bg-background/50 backdrop-blur-sm border-t">
                            <div className="flex flex-wrap gap-1">
                              {t.layout_key === 'jo-perfumes' && ['Stories Instagram', 'Social Commerce', 'Bio Perfil'].map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">{tag}</span>
                              ))}
                              {t.layout_key === 'minimal' && ['Clean', 'Elegante', 'Minimalista'].map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                              ))}
                              {t.layout_key === 'bold' && ['Vibrante', 'Moderno', 'Impactante'].map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                              ))}
                              {t.layout_key === 'premium' && ['Luxo', 'Exclusivo', 'Premium'].map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                              ))}
                              {t.layout_key === 'aurea-joalheria' && ['Elegante', 'Sofisticado', 'Refinado'].map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-heading mb-2">Tudo pronto!</h3>
                    <p className="text-muted-foreground mb-8">Sua loja "{formData.name}" está pronta para ser publicada.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-12 gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="h-12 px-6"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="h-12 px-8 btn-premium flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : currentStep === steps.length ? (
                    "Finalizar e Publicar"
                  ) : (
                    "Continuar"
                  )}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
