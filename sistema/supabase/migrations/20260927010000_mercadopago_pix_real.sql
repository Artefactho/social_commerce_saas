-- ============================================================================
-- FASE 5 — MERCADO PAGO + PIX REAL
-- Tabelas, RLS, Índices e RPCs com Claim/Lease e Compare-And-Swap (CAS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. store_payment_connections: Credenciais OAuth por Loja
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."store_payment_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'mercadopago'::"text" NOT NULL,
    "provider_user_id" "text",
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "public_key" "text",
    "token_type" "text" DEFAULT 'bearer'::"text",
    "scope" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "refresh_claim_id" "uuid",
    "refresh_lease_until" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "store_payment_connections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "store_payment_connections_store_id_key" UNIQUE ("store_id"),
    CONSTRAINT "store_payment_connections_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE,
    CONSTRAINT "store_payment_connections_status_check" CHECK ("status" IN ('active', 'revoked', 'expired'))
);

CREATE INDEX IF NOT EXISTS "idx_store_payment_connections_provider_user_id" ON "public"."store_payment_connections" ("provider_user_id");

-- ----------------------------------------------------------------------------
-- 2. mercadopago_oauth_states: Estados Efêmeros para CSRF e Replay Protection
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."mercadopago_oauth_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state" "text" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "mercadopago_oauth_states_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mercadopago_oauth_states_state_key" UNIQUE ("state"),
    CONSTRAINT "mercadopago_oauth_states_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE,
    CONSTRAINT "mercadopago_oauth_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_mercadopago_oauth_states_expires" ON "public"."mercadopago_oauth_states" ("expires_at") WHERE ("used" = false);

-- ----------------------------------------------------------------------------
-- 3. payment_transactions: Transações de Pagamento com Claim/Lease
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'mercadopago'::"text" NOT NULL,
    "provider_payment_id" "text",
    "payment_method" "text" DEFAULT 'pix'::"text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'initializing'::"text" NOT NULL,
    "qr_code_base64" "text",
    "pix_copy_paste" "text",
    "ticket_url" "text",
    "idempotency_key" "text" NOT NULL,
    "claim_id" "uuid",
    "claim_expires_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "gateway_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_transactions_order_provider_unique" UNIQUE ("order_id", "provider"),
    CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE,
    CONSTRAINT "payment_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE,
    CONSTRAINT "payment_transactions_amount_check" CHECK ("amount" >= (0)::numeric),
    CONSTRAINT "payment_transactions_status_check" CHECK ("status" IN ('initializing', 'pending', 'approved', 'rejected', 'cancelled', 'expired', 'refunded', 'failed'))
);

CREATE INDEX IF NOT EXISTS "idx_payment_transactions_provider_payment_id" ON "public"."payment_transactions" ("provider_payment_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_store_status" ON "public"."payment_transactions" ("store_id", "status");

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) LOCKDOWN
-- ----------------------------------------------------------------------------

ALTER TABLE "public"."store_payment_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mercadopago_oauth_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;

-- store_payment_connections: Nenhum acesso direto a tokens via API REST pública
-- Apenas service_role ou funções SECURITY DEFINER autorizadas acessam
DROP POLICY IF EXISTS "Owners can view non-sensitive connection info" ON "public"."store_payment_connections";
CREATE POLICY "Owners can view non-sensitive connection info" ON "public"."store_payment_connections"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."stores" s
        WHERE s."id" = "store_payment_connections"."store_id"
          AND (s."owner_id" = "auth"."uid"() OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))
    ));

-- mercadopago_oauth_states: Apenas o usuário que gerou o estado pode ler seu próprio registro
DROP POLICY IF EXISTS "Users can read own oauth states" ON "public"."mercadopago_oauth_states";
CREATE POLICY "Users can read own oauth states" ON "public"."mercadopago_oauth_states"
    FOR SELECT TO "authenticated"
    USING ("user_id" = "auth"."uid"());

-- payment_transactions: Lojistas podem visualizar transações de suas lojas
DROP POLICY IF EXISTS "Store owners can view payment transactions" ON "public"."payment_transactions";
CREATE POLICY "Store owners can view payment transactions" ON "public"."payment_transactions"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."stores" s
        WHERE s."id" = "payment_transactions"."store_id"
          AND (s."owner_id" = "auth"."uid"() OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))
    ));

GRANT USAGE ON SCHEMA "public" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."store_payment_connections" TO "service_role";
GRANT ALL ON TABLE "public"."mercadopago_oauth_states" TO "service_role";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";
GRANT SELECT ON TABLE "public"."payment_transactions" TO "authenticated";

-- ----------------------------------------------------------------------------
-- 5. RPCs DE CONTROLE DE CONCORRÊNCIA (CLAIM/LEASE E COMPARE-AND-SWAP)
-- ----------------------------------------------------------------------------

-- 5.1 Adquire Claim de Criação de Pagamento
CREATE OR REPLACE FUNCTION "public"."acquire_payment_claim"(
    "p_order_id" "uuid",
    "p_store_id" "uuid",
    "p_amount" numeric,
    "p_claim_id" "uuid",
    "p_lease_seconds" integer DEFAULT 20
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_idempotency_key TEXT;
    v_lease_until TIMESTAMPTZ;
BEGIN
    v_idempotency_key := 'order_' || p_order_id::text;
    v_lease_until := timezone('utc'::text, now()) + (p_lease_seconds || ' seconds')::interval;

    -- Tenta inserir ou assumir lease expirado/failed
    INSERT INTO public.payment_transactions (
        order_id,
        store_id,
        provider,
        amount,
        status,
        idempotency_key,
        claim_id,
        claim_expires_at
    )
    VALUES (
        p_order_id,
        p_store_id,
        'mercadopago',
        p_amount,
        'initializing',
        v_idempotency_key,
        p_claim_id,
        v_lease_until
    )
    ON CONFLICT (order_id, provider) DO UPDATE SET
        claim_id = CASE
            WHEN public.payment_transactions.status IN ('initializing', 'failed')
                 AND (public.payment_transactions.claim_expires_at IS NULL OR public.payment_transactions.claim_expires_at < timezone('utc'::text, now()))
            THEN EXCLUDED.claim_id
            ELSE public.payment_transactions.claim_id
        END,
        claim_expires_at = CASE
            WHEN public.payment_transactions.status IN ('initializing', 'failed')
                 AND (public.payment_transactions.claim_expires_at IS NULL OR public.payment_transactions.claim_expires_at < timezone('utc'::text, now()))
            THEN EXCLUDED.claim_expires_at
            ELSE public.payment_transactions.claim_expires_at
        END,
        updated_at = timezone('utc'::text, now())
    RETURNING * INTO v_tx;

    -- Retorna estado atual e se este chamador adquiriu a posse
    RETURN jsonb_build_object(
        'acquired', (v_tx.claim_id = p_claim_id),
        'transaction_id', v_tx.id,
        'status', v_tx.status,
        'claim_id', v_tx.claim_id,
        'claim_expires_at', v_tx.claim_expires_at,
        'provider_payment_id', v_tx.provider_payment_id,
        'qr_code_base64', v_tx.qr_code_base64,
        'pix_copy_paste', v_tx.pix_copy_paste,
        'expires_at', v_tx.expires_at
    );
END;
$$;

-- 5.2 Finaliza Claim de Criação de Pagamento com Guarda CAS
CREATE OR REPLACE FUNCTION "public"."finalize_payment_claim"(
    "p_order_id" "uuid",
    "p_claim_id" "uuid",
    "p_provider_payment_id" "text",
    "p_qr_code_base64" "text",
    "p_pix_copy_paste" "text",
    "p_ticket_url" "text",
    "p_expires_at" timestamp with time zone,
    "p_gateway_metadata" "jsonb" DEFAULT '{}'::"jsonb"
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_updated BOOLEAN := false;
BEGIN
    -- Atualiza APENAS se o claim pertencer a esta requisição (CAS)
    UPDATE public.payment_transactions
    SET
        provider_payment_id = COALESCE(provider_payment_id, p_provider_payment_id),
        qr_code_base64      = COALESCE(qr_code_base64, p_qr_code_base64),
        pix_copy_paste      = COALESCE(pix_copy_paste, p_pix_copy_paste),
        ticket_url          = COALESCE(ticket_url, p_ticket_url),
        expires_at          = COALESCE(expires_at, p_expires_at),
        gateway_metadata    = p_gateway_metadata,
        status              = CASE
                                WHEN status IN ('approved', 'refunded', 'paid') THEN status
                                ELSE 'pending'
                              END,
        claim_id            = NULL,
        claim_expires_at    = NULL,
        updated_at          = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND claim_id = p_claim_id
    RETURNING * INTO v_tx;

    IF FOUND THEN
        v_updated := true;
    ELSE
        -- Se perdeu o lease, obtém o estado canônico consolidado
        SELECT * INTO v_tx
        FROM public.payment_transactions
        WHERE order_id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'was_owner', v_updated,
        'transaction_id', v_tx.id,
        'status', v_tx.status,
        'provider_payment_id', v_tx.provider_payment_id,
        'qr_code_base64', v_tx.qr_code_base64,
        'pix_copy_paste', v_tx.pix_copy_paste,
        'ticket_url', v_tx.ticket_url,
        'expires_at', v_tx.expires_at
    );
END;
$$;

-- 5.3 Marca Falha de Pagamento com Guarda CAS
CREATE OR REPLACE FUNCTION "public"."fail_payment_claim"(
    "p_order_id" "uuid",
    "p_claim_id" "uuid",
    "p_error_message" "text"
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
BEGIN
    UPDATE public.payment_transactions
    SET
        status = CASE
            WHEN status IN ('approved', 'refunded', 'paid') THEN status
            ELSE 'failed'
        END,
        gateway_metadata = jsonb_build_object('error', p_error_message, 'failed_at', timezone('utc'::text, now())),
        claim_id = NULL,
        claim_expires_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND claim_id = p_claim_id
    RETURNING * INTO v_tx;

    RETURN jsonb_build_object(
        'success', FOUND,
        'status', COALESCE(v_tx.status, 'unknown')
    );
END;
$$;

-- 5.4 Confirmação Atômica de Webhook
CREATE OR REPLACE FUNCTION "public"."confirm_payment_webhook_atomic"(
    "p_order_id" "uuid",
    "p_store_id" "uuid",
    "p_provider_payment_id" "text",
    "p_paid_amount" numeric,
    "p_gateway_metadata" "jsonb" DEFAULT '{}'::"jsonb"
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_tx RECORD;
BEGIN
    -- 1. Validar e travar o pedido com Lock Pessimista
    SELECT id, store_id, total_amount, status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado.');
    END IF;

    -- 2. Validar Loja (Tenant Isolation)
    IF v_order.store_id <> p_store_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido pertence a outra loja.');
    END IF;

    -- 3. Validar Valor Exato (Auditoria Financeira)
    IF v_order.total_amount <> p_paid_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Valor pago divergente do total do pedido.');
    END IF;

    -- 4. Atualizar payment_transactions
    UPDATE public.payment_transactions
    SET
        provider_payment_id = COALESCE(provider_payment_id, p_provider_payment_id),
        status              = 'approved',
        paid_at             = COALESCE(paid_at, timezone('utc'::text, now())),
        gateway_metadata    = p_gateway_metadata,
        claim_id            = NULL,
        claim_expires_at    = NULL,
        updated_at          = timezone('utc'::text, now())
    WHERE order_id = p_order_id
    RETURNING * INTO v_tx;

    -- 5. Atualizar Pedido para 'paid' (Idempotente: apenas se estiver pending)
    UPDATE public.orders
    SET
        status = 'paid'
    WHERE id = p_order_id
      AND status = 'pending';

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_status', 'paid',
        'transaction_status', 'approved',
        'paid_amount', p_paid_amount
    );
END;
$$;

-- 5.5 Adquire Claim de Renovação OAuth
CREATE OR REPLACE FUNCTION "public"."acquire_oauth_refresh_claim"(
    "p_store_id" "uuid",
    "p_claim_id" "uuid",
    "p_lease_seconds" integer DEFAULT 15
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conn RECORD;
    v_lease_until TIMESTAMPTZ;
BEGIN
    v_lease_until := timezone('utc'::text, now()) + (p_lease_seconds || ' seconds')::interval;

    UPDATE public.store_payment_connections
    SET
        refresh_claim_id = p_claim_id,
        refresh_lease_until = v_lease_until,
        updated_at = timezone('utc'::text, now())
    WHERE store_id = p_store_id
      AND (refresh_lease_until IS NULL OR refresh_lease_until < timezone('utc'::text, now()))
    RETURNING * INTO v_conn;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'acquired', true,
            'refresh_token', v_conn.refresh_token,
            'access_token', v_conn.access_token,
            'expires_at', v_conn.expires_at
        );
    ELSE
        SELECT * INTO v_conn FROM public.store_payment_connections WHERE store_id = p_store_id;
        RETURN jsonb_build_object(
            'acquired', false,
            'access_token', v_conn.access_token,
            'expires_at', v_conn.expires_at
        );
    END IF;
END;
$$;

-- 5.6 Finaliza Renovação OAuth com Guarda CAS
CREATE OR REPLACE FUNCTION "public"."finalize_oauth_refresh_claim"(
    "p_store_id" "uuid",
    "p_claim_id" "uuid",
    "p_access_token" "text",
    "p_refresh_token" "text",
    "p_expires_in_seconds" integer
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_expires_at TIMESTAMPTZ;
BEGIN
    v_new_expires_at := timezone('utc'::text, now()) + (p_expires_in_seconds || ' seconds')::interval;

    UPDATE public.store_payment_connections
    SET
        access_token = p_access_token,
        refresh_token = p_refresh_token,
        expires_at = v_new_expires_at,
        status = 'active',
        refresh_claim_id = NULL,
        refresh_lease_until = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE store_id = p_store_id
      AND refresh_claim_id = p_claim_id;

    RETURN jsonb_build_object(
        'success', FOUND,
        'expires_at', v_new_expires_at
    );
END;
$$;

-- Revoga execução pública das RPCs sensíveis
REVOKE ALL ON FUNCTION "public"."acquire_payment_claim"("uuid", "uuid", numeric, "uuid", integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."acquire_payment_claim"("uuid", "uuid", numeric, "uuid", integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."finalize_payment_claim"("uuid", "uuid", "text", "text", "text", "text", timestamp with time zone, "jsonb") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."finalize_payment_claim"("uuid", "uuid", "text", "text", "text", "text", timestamp with time zone, "jsonb") TO "service_role";

REVOKE ALL ON FUNCTION "public"."fail_payment_claim"("uuid", "uuid", "text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."fail_payment_claim"("uuid", "uuid", "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."confirm_payment_webhook_atomic"("uuid", "uuid", "text", numeric, "jsonb") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."confirm_payment_webhook_atomic"("uuid", "uuid", "text", numeric, "jsonb") TO "service_role";

REVOKE ALL ON FUNCTION "public"."acquire_oauth_refresh_claim"("uuid", "uuid", integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."acquire_oauth_refresh_claim"("uuid", "uuid", integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."finalize_oauth_refresh_claim"("uuid", "uuid", "text", "text", integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."finalize_oauth_refresh_claim"("uuid", "uuid", "text", "text", integer) TO "service_role";
