import { useState, useEffect, useRef } from "react";
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
  Edit,
  Tag,
  Ticket,
  Layers,
  Upload,
  Image as ImageIcon,
  X,
  ArrowUp,
  ArrowDown,
  Sliders,
  Video,
  MessageCircle,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProductModal } from "@/components/ProductModal";
import { DEFAULT_TEMPLATES } from "./Onboarding";
import { VisualStoreEditor } from "@/features/theme/VisualStoreEditor";
import { cancelOrder, refundOrder } from "@/services/order/OrderService";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbTemplates, setDbTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
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
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_type: "percentage", discount_value: "" });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [appearanceSubTab, setAppearanceSubTab] = useState<"themes" | "branding" | "sections">("themes");
  const [themeConfig, setThemeConfig] = useState<any>(null);
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [storeSections, setStoreSections] = useState<any[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [editSectionForm, setEditSectionForm] = useState<Record<string, any>>({});
  const [settingsName, setSettingsName] = useState("");
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(null);
  const [settingsPrimaryColor, setSettingsPrimaryColor] = useState("#7C3AED");
  const [settingsAccentColor, setSettingsAccentColor] = useState("#E11D48");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const settingsLogoInputRef = useRef<HTMLInputElement>(null);

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

  const handleCancelOrder = async (orderId: string) => {
    if (!store?.id) return;
    const confirmCancel = window.confirm("Deseja realmente cancelar este pedido pendente?");
    if (!confirmCancel) return;

    setProcessingOrderId(orderId);
    try {
      const res = await cancelOrder({ orderId, storeId: store.id });
      if (res.success) {
        toast.success(res.message || "Pedido cancelado com sucesso.");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar pedido.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    if (!store?.id) return;
    const confirmRefund = window.confirm(
      "Deseja estornar e reembolsar este pedido integralmente via Mercado Pago?"
    );
    if (!confirmRefund) return;

    setProcessingOrderId(orderId);
    try {
      const res = await refundOrder({ orderId, storeId: store.id });
      if (res.success) {
        toast.success(res.message || "Reembolso processado com sucesso!");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar estorno.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const fetchCategories = async (storeId: string) => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchCoupons = async (storeId: string) => {
    setIsLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // Fase 4 (parte pendente): UI para o lojista trocar o tema oficial da loja
  // sem precisar editar `store_theme_configs.config` via SQL. O "tema
  // padrão" (3 layouts minimal/bold/premium, controlados por
  // stores.active_template_id na aba Aparência) e o "Aura Maison"
  // (Theme Contract, Fase 4) coexistem: themeId === "aura-maison" ativa o
  // novo tema em PublicStore.tsx, qualquer outro valor cai no fallback
  // genérico — nunca derruba a loja (skills/theme-contract.md secao 10).
  const fetchThemeConfig = async (storeId: string) => {
    setIsLoadingTheme(true);
    try {
      const { data, error } = await supabase
        .from("store_theme_configs")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error) throw error;
      setThemeConfig(data);
    } catch (error: any) {
      console.error("Error fetching theme config:", error);
    } finally {
      setIsLoadingTheme(false);
    }
  };

  const handleActivateTheme = async (themeKey: string) => {
    const currentThemeId = themeConfig?.config?.themeId ?? "base-theme";
    // Mapear layout_key ou id para o template do banco
    const matchingTemplate = dbTemplates.find(
      (t) =>
        t.layout_key === themeKey ||
        (themeKey === "aura-maison" && (t.layout_key === "premium" || t.layout_key === "aura-maison")) ||
        (themeKey === "minimal-clean" && (t.layout_key === "minimal" || t.layout_key === "minimal-clean")) ||
        t.id === themeKey
    );
    const templateId = matchingTemplate?.id || store.active_template_id;

    if (currentThemeId === themeKey && store.active_template_id === templateId) return;

    setIsUpdatingTheme(true);
    try {
      // 1. Sincronizar active_template_id na tabela stores
      if (templateId) {
        const { error: storeError } = await supabase
          .from("stores")
          .update({ active_template_id: templateId })
          .eq("id", store.id);
        if (storeError) throw storeError;
      }

      // 2. Sincronizar themeId no store_theme_configs.config
      const currentConfig = (themeConfig?.config as Record<string, any>) || {};
      const newConfig = { ...currentConfig, themeId: themeKey };
      const { error: configError } = await supabase
        .from("store_theme_configs")
        .update({ config: newConfig })
        .eq("store_id", store.id);

      if (configError) {
        await supabase
          .from("store_theme_configs")
          .upsert({ store_id: store.id, config: newConfig }, { onConflict: "store_id" });
      }

      setStore((prev: any) => ({ ...prev, active_template_id: templateId }));
      setThemeConfig((prev: any) => ({ ...prev, config: newConfig }));
      toast.success("Tema ativado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao ativar tema:", error);
      toast.error("Erro ao ativar o tema: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const DEFAULT_SECTIONS_SEED = [
    { section_type: "hero_slider", enabled: true, position: 10, settings: { title: "Destaques & Ofertas", subtitle: "Coleção Exclusiva", buttonText: "Ver Produtos" } },
    { section_type: "benefits_bar", enabled: true, position: 20, settings: {} },
    { section_type: "video_feature", enabled: true, position: 30, settings: { title: "Conheça Nossos Produtos", subtitle: "Vídeo em Alta Definição", description: "Assista aos detalhes e conheça nossa qualidade." } },
    { section_type: "social_feed", enabled: true, position: 40, settings: { title: "Siga no Instagram", subtitle: "Comunidade Oficial" } },
    { section_type: "whatsapp_cta", enabled: true, position: 50, settings: {} },
    { section_type: "newsletter", enabled: true, position: 60, settings: { title: "Receba Novidades Exclusivas", badge: "Newsletter" } },
  ];

  const fetchStoreSections = async (storeId: string) => {
    setIsLoadingSections(true);
    try {
      const { data, error } = await supabase
        .from("store_sections")
        .select("*")
        .eq("store_id", storeId)
        .order("position", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setStoreSections(data);
      } else {
        const seeds = DEFAULT_SECTIONS_SEED.map((s) => ({
          store_id: storeId,
          section_type: s.section_type,
          enabled: s.enabled,
          position: s.position,
          settings: s.settings,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from("store_sections")
          .insert(seeds)
          .select("*")
          .order("position", { ascending: true });
        if (!insertError && inserted) {
          setStoreSections(inserted);
        } else {
          setStoreSections(seeds);
        }
      }
    } catch (error: any) {
      console.error("Error fetching store sections:", error);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const handleToggleSection = async (section: any) => {
    const newEnabled = !section.enabled;
    const updated = storeSections.map((s) => (s.id === section.id ? { ...s, enabled: newEnabled } : s));
    setStoreSections(updated);
    try {
      if (section.id) {
        await supabase.from("store_sections").update({ enabled: newEnabled }).eq("id", section.id);
        toast.success(newEnabled ? "Seção ativada!" : "Seção desativada!");
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar seção");
    }
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === storeSections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newSections = [...storeSections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const reordered = newSections.map((sec, idx) => ({
      ...sec,
      position: (idx + 1) * 10,
    }));

    setStoreSections(reordered);

    try {
      for (const sec of reordered) {
        if (sec.id) {
          await supabase.from("store_sections").update({ position: sec.position }).eq("id", sec.id);
        }
      }
      toast.success("Ordem das seções atualizada!");
    } catch (err) {
      toast.error("Erro ao salvar nova ordem");
    }
  };

  const handleOpenEditSection = (section: any) => {
    setEditingSection(section);
    setEditSectionForm(section.settings || {});
  };

  const handleSaveSectionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const updated = storeSections.map((s) => (s.id === editingSection.id ? { ...s, settings: editSectionForm } : s));
    setStoreSections(updated);
    try {
      if (editingSection.id) {
        await supabase.from("store_sections").update({ settings: editSectionForm }).eq("id", editingSection.id);
        toast.success("Configurações da seção salvas com sucesso!");
      }
      setEditingSection(null);
    } catch (err: any) {
      toast.error("Erro ao salvar configurações da seção: " + err.message);
    }
  };

  // Preenche o formulário de Configurações com o estado salvo assim que a
  // loja e o theme config terminam de carregar (só uma vez por carregamento
  // — depois disso os campos são controlados pelo próprio formulário).
  const [hasHydratedSettings, setHasHydratedSettings] = useState(false);
  useEffect(() => {
    if (hasHydratedSettings || !store || isLoadingTheme) return;

    const hydrate = async () => {
      setSettingsName(store.name || "");

      const colors = (themeConfig?.config as Record<string, any>)?.colors || {};
      setSettingsPrimaryColor(colors.primary || "#7C3AED");
      setSettingsAccentColor(colors.accentPromotion || "#E11D48");

      if (store.logo_url) {
        if (store.logo_url.startsWith("http")) {
          setSettingsLogoPreview(store.logo_url);
        } else {
          const { data } = await supabase.storage
            .from("products")
            .createSignedUrl(store.logo_url, 31536000);
          setSettingsLogoPreview(data?.signedUrl || null);
        }
      }
      setHasHydratedSettings(true);
    };
    hydrate();
  }, [store, themeConfig, isLoadingTheme, hasHydratedSettings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WebP ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande. Máximo 2MB.");
      return;
    }

    setSettingsLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setSettingsLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setSettingsLogoFile(null);
    setSettingsLogoPreview(null);
    if (settingsLogoInputRef.current) settingsLogoInputRef.current.value = "";
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) {
      toast.error("O nome da loja não pode ficar em branco.");
      return;
    }

    setIsSavingSettings(true);
    try {
      // Reaproveita o bucket "products" (já existente, sem migration nova)
      // numa pasta própria por loja — mesmo padrão de isolamento por
      // {store_id}/... já usado pelas imagens de produto.
      let logoUrl = store.logo_url || null;
      if (settingsLogoFile) {
        const fileExt = settingsLogoFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${store.id}/logo/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, settingsLogoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoUrl = filePath;
      } else if (settingsLogoPreview === null) {
        logoUrl = null;
      }

      const { error: storeError } = await supabase
        .from("stores")
        .update({ name: settingsName.trim(), logo_url: logoUrl })
        .eq("id", store.id);
      if (storeError) throw storeError;

      const currentConfig = (themeConfig?.config as Record<string, any>) || {};
      const newConfig = {
        ...currentConfig,
        colors: { ...currentConfig.colors, primary: settingsPrimaryColor, accentPromotion: settingsAccentColor },
      };
      const { error: themeError } = await supabase
        .from("store_theme_configs")
        .update({ config: newConfig })
        .eq("store_id", store.id);
      if (themeError) throw themeError;

      setStore((prev: any) => ({ ...prev, name: settingsName.trim(), logo_url: logoUrl }));
      setThemeConfig((prev: any) => ({ ...prev, config: newConfig }));
      setSettingsLogoFile(null);
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações: " + error.message);
    } finally {
      setIsSavingSettings(false);
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
        fetchCategories(data.id);
        fetchCoupons(data.id);
        fetchThemeConfig(data.id);
        fetchStoreSections(data.id);
      }
      setIsLoading(false);
    };

    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .eq("active", true);
        if (data && data.length > 0) {
          setDbTemplates(data);
        } else {
          setDbTemplates(DEFAULT_TEMPLATES);
        }
      } catch {
        setDbTemplates(DEFAULT_TEMPLATES);
      }
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
    const chosen = dbTemplates.find((t) => t.id === templateId);
    const chosenLayoutKey = chosen?.layout_key || "base-theme";
    await handleActivateTheme(chosenLayoutKey);
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

  const slugify = (text: string) => {
    const withoutDiacritics = text
      .normalize("NFD")
      .split("")
      .filter((char) => char.charCodeAt(0) < 0x0300 || char.charCodeAt(0) > 0x036f)
      .join("");
    return withoutDiacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const { error } = await supabase.from("categories").insert({
        store_id: store.id,
        name: newCategoryName.trim(),
        slug: slugify(newCategoryName),
        sort_order: categories.length,
      });
      if (error) throw error;
      toast.success("Categoria criada!");
      setNewCategoryName("");
      fetchCategories(store.id);
    } catch (error: any) {
      toast.error("Erro ao criar categoria: " + error.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria excluída!");
      fetchCategories(store.id);
    } catch (error: any) {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code.trim() || !newCoupon.discount_value) return;
    setIsSavingCoupon(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        store_id: store.id,
        code: newCoupon.code.trim().toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: Number(newCoupon.discount_value),
      });
      if (error) throw error;
      toast.success("Cupom criado!");
      setNewCoupon({ code: "", discount_type: "percentage", discount_value: "" });
      fetchCoupons(store.id);
    } catch (error: any) {
      toast.error("Erro ao criar cupom: " + error.message);
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: any) => {
    try {
      const { error } = await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id);
      if (error) throw error;
      fetchCoupons(store.id);
    } catch (error: any) {
      toast.error("Erro ao atualizar cupom");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Cupom excluído!");
      fetchCoupons(store.id);
    } catch (error: any) {
      toast.error("Erro ao excluir cupom");
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
            { id: "categories", label: "Categorias", icon: Tag },
            { id: "coupons", label: "Cupons", icon: Ticket },
            { id: "orders", label: "Pedidos", icon: ShoppingCart },
            { id: "plans", label: "Assinatura", icon: DollarSign },
            { id: "appearance", label: "Aparência", icon: Palette },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => {
            const isActive = activeTab === item.id || (item.id === "appearance" && activeTab === "theme");
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
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

          {(activeTab === "appearance" || activeTab === "theme") && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-heading font-bold">Personalização & Aparência</h2>
                  <p className="text-muted-foreground text-sm">
                    Escolha o tema, personalize a identidade visual e configure as seções da sua vitrine pública.
                  </p>
                </div>
                {store?.slug && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Minha Loja
                    </a>
                  </Button>
                )}
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-border gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setAppearanceSubTab("themes")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    appearanceSubTab === "themes"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Tema
                </button>
                <button
                  type="button"
                  onClick={() => setAppearanceSubTab("branding")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    appearanceSubTab === "branding"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Personalizar
                </button>
                <button
                  type="button"
                  onClick={() => setAppearanceSubTab("sections")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    appearanceSubTab === "sections"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Seções
                </button>
              </div>

              {/* SUB-TAB 1: TEMA (5 Temas Oficiais) */}
              {appearanceSubTab === "themes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-heading font-bold">5 Temas Oficiais do Sistema</h3>
                    <p className="text-muted-foreground text-sm">
                      Escolha o estilo visual da sua loja. O tema selecionado se aplica imediatamente à sua vitrine pública.
                    </p>
                  </div>

                  {isLoadingTheme ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { 
                          id: "base-theme", 
                          name: "Base Theme", 
                          tag: "Nuvemshop Base",
                          description: "Tema clássico e multi-propósito com sliders, banners informativos, instafeed, vídeo e QuickShop.",
                          preview: "/store/demo-base-theme"
                        },
                        { 
                          id: "aura-maison", 
                          name: "Aura Maison", 
                          tag: "Alta Moda & Luxo",
                          description: "Tema oficial de alta costura e moda com catálogo sofisticado, cores customizáveis e carrinho premium.",
                          preview: "/store/demo-aura-maison"
                        },
                        { 
                          id: "aurea-joalheria", 
                          name: "Áurea Joalheria", 
                          tag: "Joalheria & Gemas",
                          description: "Tema em tons de ônix e ouro 18k com tipografia serifada de alta conversão para joias e relógios.",
                          preview: "/store/demo-aurea-joalheria"
                        },
                        { 
                          id: "jo-perfumes", 
                          name: "Jô Perfumes & Cosméticos", 
                          tag: "Social Commerce & Stories",
                          description: "Tema estilo Instagram Shop com stories em destaque, perfil verificado e navegação mobile otimizada.",
                          preview: "/store/demo-jo-perfumes"
                        },
                        { 
                          id: "minimal-clean", 
                          name: "Minimal Clean", 
                          tag: "Design Nórdico",
                          description: "Design moderno e minimalista com foco total na apresentação dos produtos e conversão limpa.",
                          preview: "/store/demo-minimal-clean"
                        },
                      ].map((option) => {
                        const currentThemeId = themeConfig?.config?.themeId ?? "base-theme";
                        const isActive = currentThemeId === option.id;
                        return (
                          <Card
                            key={option.id}
                            className={`transition-all duration-300 flex flex-col justify-between ${
                              isActive ? "ring-2 ring-primary shadow-xl bg-card" : "hover:shadow-lg opacity-85 hover:opacity-100"
                            }`}
                          >
                            <CardHeader className="p-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {option.tag}
                                </span>
                                {isActive && (
                                  <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Check className="w-3 h-3" />
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <CardTitle className="text-xl font-bold">{option.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 space-y-4 flex-1 flex flex-col justify-between">
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                              <div className="space-y-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => window.open(option.preview, "_blank")}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Demonstração
                                </Button>
                                {isActive ? (
                                  <Button className="w-full bg-emerald-600 hover:bg-emerald-600 text-white cursor-default" disabled>
                                    <Check className="w-4 h-4 mr-2" />
                                    Tema Ativo
                                  </Button>
                                ) : (
                                  <Button className="w-full btn-premium" onClick={() => handleActivateTheme(option.id)} disabled={isUpdatingTheme}>
                                    {isUpdatingTheme ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar Tema"}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: PERSONALIZAR / VISUAL CUSTOMIZER V2 */}
              {appearanceSubTab === "branding" && (
                <VisualStoreEditor
                  store={store}
                  themeConfig={themeConfig}
                  storeSections={storeSections}
                  products={products}
                  categories={categories}
                  onSaveSuccess={(updatedStore, updatedConfig) => {
                    setStore((prev: any) => ({ ...prev, ...updatedStore }));
                    setThemeConfig(updatedConfig);
                    setSettingsName(updatedStore.name);
                    if (updatedStore.logo_url) {
                      setSettingsLogoPreview(updatedStore.logo_url);
                    }
                  }}
                />
              )}

              {/* SUB-TAB 3: SEÇÕES DA HOME */}
              {appearanceSubTab === "sections" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-heading font-bold">Seções da Página Inicial</h3>
                    <p className="text-muted-foreground text-sm">
                      Escolha o que aparece na página da sua loja e em qual ordem (Section Engine).
                    </p>
                  </div>

                  {isLoadingSections ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {storeSections.map((sec, idx) => {
                        const sectionNames: Record<string, { label: string; desc: string; icon: any }> = {
                          hero_slider: { label: "Banner Hero Principal", desc: "Destaque visual de topo com títulos e botão de chamada.", icon: Sparkles },
                          benefits_bar: { label: "Barra de Vantagens & Benefícios", desc: "Ícones de frete grátis, parcelamento, segurança e suporte.", icon: ShieldCheck },
                          video_feature: { label: "Seção de Vídeo em Destaque", desc: "Player em alta definição com capa e reprodução imersiva.", icon: Video },
                          social_feed: { label: "Feed Social / Instagram", desc: "Grade de fotos e engajamento da sua comunidade.", icon: ImageIcon },
                          whatsapp_cta: { label: "Chamada para o WhatsApp", desc: "Botão direto para atendimento e fechamento de vendas.", icon: MessageCircle },
                          newsletter: { label: "Captura de Newsletter", desc: "Formulário de cadastro para cupons e novidades.", icon: Ticket },
                          categories_carousel: { label: "Carrossel de Categorias", desc: "Navegação rápida pelos departamentos da loja.", icon: Tag },
                          featured_products: { label: "Grade de Produtos em Destaque", desc: "Exibição do catálogo principal.", icon: Package },
                        };

                        const info = sectionNames[sec.section_type] || {
                          label: sec.section_type,
                          desc: "Seção dinâmica da loja.",
                          icon: Sliders,
                        };
                        const IconComponent = info.icon;

                        return (
                          <div
                            key={sec.id || idx}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              sec.enabled ? "bg-card border-border shadow-sm" : "bg-muted/40 border-muted opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm">{info.label}</h4>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    sec.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"
                                  }`}>
                                    {sec.enabled ? "Ativa" : "Oculta"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{info.desc}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={idx === 0}
                                onClick={() => handleMoveSection(idx, "up")}
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={idx === storeSections.length - 1}
                                onClick={() => handleMoveSection(idx, "down")}
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold"
                                onClick={() => handleOpenEditSection(sec)}
                              >
                                <Edit className="w-3.5 h-3.5 mr-1.5" />
                                Configurar
                              </Button>
                              <Button
                                variant={sec.enabled ? "default" : "secondary"}
                                size="sm"
                                className="h-8 text-xs font-bold"
                                onClick={() => handleToggleSection(sec)}
                              >
                                {sec.enabled ? "Desativar" : "Ativar"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Section Modal */}
              {editingSection && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-background border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="font-heading font-bold text-lg">Configurar Seção</h3>
                        <p className="text-xs text-muted-foreground">Personalize os textos e links exibidos.</p>
                      </div>
                      <button onClick={() => setEditingSection(null)} className="p-1.5 rounded-full hover:bg-secondary">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSectionSettings} className="space-y-4 text-sm">
                      <div className="space-y-1.5">
                        <Label>Título Principal</Label>
                        <Input
                          value={editSectionForm.title || ""}
                          onChange={(e) => setEditSectionForm({ ...editSectionForm, title: e.target.value })}
                          placeholder="Ex: Destaques & Ofertas"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Subtítulo / Badge</Label>
                        <Input
                          value={editSectionForm.subtitle || editSectionForm.badge || ""}
                          onChange={(e) => setEditSectionForm({ ...editSectionForm, subtitle: e.target.value, badge: e.target.value })}
                          placeholder="Ex: Coleção Exclusiva"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Descrição</Label>
                        <Input
                          value={editSectionForm.description || ""}
                          onChange={(e) => setEditSectionForm({ ...editSectionForm, description: e.target.value })}
                          placeholder="Breve descrição da seção"
                        />
                      </div>

                      {editingSection.section_type === "hero_slider" && (
                        <div className="space-y-1.5">
                          <Label>Texto do Botão</Label>
                          <Input
                            value={editSectionForm.buttonText || ""}
                            onChange={(e) => setEditSectionForm({ ...editSectionForm, buttonText: e.target.value })}
                            placeholder="Ex: VER PRODUTOS"
                          />
                        </div>
                      )}

                      {editingSection.section_type === "video_feature" && (
                        <div className="space-y-1.5">
                          <Label>URL do Vídeo (MP4 ou link direto)</Label>
                          <Input
                            value={editSectionForm.videoUrl || ""}
                            onChange={(e) => setEditSectionForm({ ...editSectionForm, videoUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      )}

                      {editingSection.section_type === "social_feed" && (
                        <div className="space-y-1.5">
                          <Label>Usuário do Instagram (@)</Label>
                          <Input
                            value={editSectionForm.handle || ""}
                            onChange={(e) => setEditSectionForm({ ...editSectionForm, handle: e.target.value })}
                            placeholder="@sualoja"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setEditingSection(null)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="btn-premium">
                          Salvar Alterações
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 max-w-2xl"
            >
              <div>
                <h2 className="text-2xl font-heading font-bold">Configurações da Loja</h2>
                <p className="text-muted-foreground text-sm">
                  Nome, logo e cores da sua identidade visual (Store Configuration).
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Nome da loja</Label>
                  <Input
                    id="settings-name"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Ex: Minha Boutique"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted shrink-0">
                      {settingsLogoPreview ? (
                        <img src={settingsLogoPreview} alt="Logo da loja" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={settingsLogoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="settings-logo-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => settingsLogoInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {settingsLogoPreview ? "Trocar logo" : "Enviar logo"}
                      </Button>
                      {settingsLogoPreview && (
                        <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                          <X className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou SVG, até 2MB.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="settings-primary-color">Cor primária</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="settings-primary-color"
                        type="color"
                        value={settingsPrimaryColor}
                        onChange={(e) => setSettingsPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border cursor-pointer shrink-0"
                      />
                      <Input
                        value={settingsPrimaryColor}
                        onChange={(e) => setSettingsPrimaryColor(e.target.value)}
                        className="h-12 font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-accent-color">Cor de destaque</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="settings-accent-color"
                        type="color"
                        value={settingsAccentColor}
                        onChange={(e) => setSettingsAccentColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border cursor-pointer shrink-0"
                      />
                      <Input
                        value={settingsAccentColor}
                        onChange={(e) => setSettingsAccentColor(e.target.value)}
                        className="h-12 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-4">
                  As cores hoje só aparecem no tema <strong>Aura Maison</strong> (botões, destaques e
                  contadores) — o layout Padrão (aba Aparência) não usa cor por loja ainda.
                </p>

                <Button type="submit" className="btn-premium h-12 px-8" disabled={isSavingSettings}>
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Configurações
                </Button>
              </form>
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
                          <th className="pb-4 font-medium text-right">Ações</th>
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
                                order.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-600"
                                  : order.status === "paid"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}>
                                {order.status === "pending" ? "Pendente" : order.status === "paid" ? "Pago" : "Cancelado"}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground capitalize">
                              {order.payment_method?.replace("_", " ") || "N/A"}
                            </td>
                            <td className="py-4 text-right">
                              {order.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={processingOrderId === order.id}
                                  id={`cancel-order-btn-${order.id}`}
                                >
                                  {processingOrderId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  ) : null}
                                  Cancelar
                                </Button>
                              )}
                              {order.status === "paid" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                  onClick={() => handleRefundOrder(order.id)}
                                  disabled={processingOrderId === order.id}
                                  id={`refund-order-btn-${order.id}`}
                                >
                                  {processingOrderId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  ) : null}
                                  Estornar / Reembolsar
                                </Button>
                              )}
                              {order.status === "cancelled" && (
                                <span className="text-xs text-muted-foreground italic">Encerrado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!isLoadingOrders && orders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              Nenhum pedido recebido ainda.
                            </td>
                          </tr>
                        )}
                        {isLoadingOrders && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center">
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

          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Nova Categoria</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Input
                    placeholder="Ex: Perfumes"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} disabled={isSavingCategory || !newCategoryName.trim()}>
                    {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Categorias da Loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {categories.map((cat) => (
                      <div key={cat.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {!isLoadingCategories && categories.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
                    )}
                    {isLoadingCategories && (
                      <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "coupons" && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Novo Cupom</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      placeholder="BEMVINDA10"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newCoupon.discount_type}
                      onValueChange={(v) => setNewCoupon((c) => ({ ...c, discount_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10"
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon((c) => ({ ...c, discount_value: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddCoupon} disabled={isSavingCoupon || !newCoupon.code.trim() || !newCoupon.discount_value}>
                    {isSavingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Cupom"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Cupons da Loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{coupon.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {coupon.discount_type === "percentage" ? `${coupon.discount_value}% de desconto` : `R$ ${Number(coupon.discount_value).toFixed(2)} de desconto`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleToggleCoupon(coupon)}>
                            {coupon.active ? "Ativo" : "Inativo"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!isLoadingCoupons && coupons.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">Nenhum cupom cadastrado ainda.</p>
                    )}
                    {isLoadingCoupons && (
                      <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab !== "overview" && activeTab !== "appearance" && activeTab !== "theme" && activeTab !== "settings" && activeTab !== "orders" && activeTab !== "categories" && activeTab !== "coupons" && activeTab !== "plans" && (
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
        categories={categories}
      />
    </div>
  );
};

export default Dashboard;
