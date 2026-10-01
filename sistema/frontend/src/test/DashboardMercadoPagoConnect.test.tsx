import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { activePaymentService } from "@/services/payment/PaymentProvider";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://test.com/logo.png" } }),
          upload: vi.fn(),
        }),
      },
    },
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GAP-01: Interface de Conexão Mercado Pago no Dashboard", () => {
  const fakeStore = {
    id: "store-test-123",
    owner_id: "user-owner-123",
    name: "Loja Teste Conexão",
    slug: "loja-teste-conexao",
    plan_id: "plan-1",
    trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    logo_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-owner-123", email: "owner@test.com" } },
      error: null,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: fakeStore, error: null }),
          single: vi.fn().mockResolvedValue({ data: fakeStore, error: null }),
          update: vi.fn().mockReturnThis(),
        };
      }
      if (table === "templates" || table === "plans" || table === "products" || table === "orders" || table === "categories" || table === "coupons" || table === "store_sections") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "store_theme_configs") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { config: {} }, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
  });

  it("Teste 1: Dashboard renderiza estado 'não conectado' quando não há conexão ativa", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: false,
      provider: "mercadopago",
      status: "inactive",
    });

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Meios de Pagamento")).toBeInTheDocument();
    });

    expect(screen.getByText("Mercado Pago não conectado")).toBeInTheDocument();
    expect(screen.getByText("Receba pagamentos instantâneos via Pix")).toBeInTheDocument();
  });

  it("Teste 2: Botão 'Conectar Mercado Pago' existe no estado não conectado", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: false,
      provider: "mercadopago",
      status: "inactive",
    });

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Conectar Mercado Pago/i })).toBeInTheDocument();
    });
  });

  it("Teste 3 & 4: Clique no botão chama connectMercadoPago e redireciona o navegador", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: false,
      provider: "mercadopago",
      status: "inactive",
    });

    const connectSpy = vi.spyOn(activePaymentService, "connectMercadoPago").mockResolvedValueOnce({
      url: "https://auth.mercadopago.com/authorization?client_id=123&state=abc-state",
      state: "abc-state",
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: "" };

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /Conectar Mercado Pago/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(connectSpy).toHaveBeenCalledWith("store-test-123");
      expect(window.location.href).toBe("https://auth.mercadopago.com/authorization?client_id=123&state=abc-state");
    });
  });

  it("Teste 5: Estado 'conectado' é exibido quando a conexão existente estiver ativa", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: true,
      provider: "mercadopago",
      status: "active",
      providerUserId: "MP-USER-987654",
      updatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mercado Pago Conectado")).toBeInTheDocument();
    });

    expect(screen.getByText("Pronto para receber pagamentos")).toBeInTheDocument();
    expect(screen.getByText("MP-USER-987654")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reconectar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Atualizar Status/i })).toBeInTheDocument();
  });

  it("Teste 6: Token e segredos NUNCA são renderizados no DOM", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: true,
      provider: "mercadopago",
      status: "active",
      providerUserId: "PUBLIC_ID_123",
      updatedAt: new Date().toISOString(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mercado Pago Conectado")).toBeInTheDocument();
    });

    const domHtml = container.innerHTML;
    expect(domHtml).not.toContain("access_token");
    expect(domHtml).not.toContain("refresh_token");
    expect(domHtml).not.toContain("client_secret");
    expect(domHtml).not.toContain("APP_USR-");
  });

  it("Teste 7: Erro de conexão exibe toast amigável e não produz falso positivo de conexão", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: false,
      provider: "mercadopago",
      status: "inactive",
    });

    vi.spyOn(activePaymentService, "connectMercadoPago").mockRejectedValueOnce(
      new Error("Loja sem permissão ou credencial inválida.")
    );

    const { toast } = await import("sonner");

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /Conectar Mercado Pago/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Loja sem permissão ou credencial inválida.");
      // Continua no estado não conectado
      expect(screen.getByText("Mercado Pago não conectado")).toBeInTheDocument();
    });
  });

  it("Teste 8: Duplo clique não dispara duas conexões simultâneas (proteção ativa)", async () => {
    vi.spyOn(activePaymentService, "getStoreConnectionStatus").mockResolvedValueOnce({
      connected: false,
      provider: "mercadopago",
      status: "inactive",
    });

    let resolvePromise: (v: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const connectSpy = vi.spyOn(activePaymentService, "connectMercadoPago").mockReturnValue(pendingPromise as any);

    render(
      <MemoryRouter initialEntries={["/dashboard?tab=payments"]}>
        <Dashboard />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /Conectar Mercado Pago/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Finalizar promise
    resolvePromise!({ url: "https://auth.mercadopago.com", state: "state-1" });
  });
});
