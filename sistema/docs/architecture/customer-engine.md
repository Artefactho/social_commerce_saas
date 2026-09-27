# Customer Engine — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Gestão do consumidor final da loja, seus endereços, autenticação e histórico de pedidos.

---

## 1. Separação de Identidades (Merchant vs. Customer)

```text
┌────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH                        │
├───────────────────────────┬────────────────────────────┤
│      SaaS MERCHANT        │     STORE END-CUSTOMER     │
├───────────────────────────┼────────────────────────────┤
│ • Lojista / Dono da Loja  │ • Comprador da Loja X      │
│ • Acesso a /dashboard     │ • Acesso a /store/:slug    │
│ • Gerencia catálogo/pedidos│ • Visualiza seus pedidos  │
│ • Tabela: profiles/members│ • Tabela: customers        │
└───────────────────────────┴────────────────────────────┘
```

---

## 2. Modelo de Dados do Consumidor (`Customer`)

```sql
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    document_cpf TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT customers_store_email_unique UNIQUE (store_id, email)
);

CREATE TABLE public.customer_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false
);
```

---

## 3. Experiência de Compra (Guest vs. Cadastrado)
- **Guest Checkout (Padrão para Social Traffic):** O comprador não é forçado a criar senha para fechar a compra rápida vinda do Instagram/TikTok. Os dados são salvos em `customers` vinculados ao `store_id`.
- **Magic Link / Acesso Rápido:** O cliente pode consultar o status do pedido via link único e seguro enviado por WhatsApp ou E-mail.
