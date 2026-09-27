-- ============================================================================
-- FASE 5 — CANCELAMENTO E REEMBOLSO DE PEDIDOS
-- RPCs Atômicas com Controle de Concorrência, CAS e Isolamento Multi-Tenant
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. cancel_order_atomic: Cancelamento Atômico de Pedidos Não-Pagos
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."cancel_order_atomic"(
    "p_order_id" "uuid",
    "p_store_id" "uuid",
    "p_user_id" "uuid",
    "p_reason" "text" DEFAULT NULL
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_order RECORD;
    v_tx RECORD;
BEGIN
    -- 1. Validar Autorização do Lojista (Owner da loja ou Admin)
    SELECT EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = p_store_id
          AND (s.owner_id = p_user_id OR public.has_role(p_user_id, 'admin'::public.app_role))
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Não autorizado a cancelar pedidos desta loja.');
    END IF;

    -- 2. Lock Pessimista no Pedido
    SELECT id, store_id, total_amount, status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado.');
    END IF;

    -- 3. Validação Estrita de Multi-Tenant
    IF v_order.store_id <> p_store_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido pertence a outra loja.');
    END IF;

    -- 4. Idempotência: Se já estiver cancelado, retorna sucesso e os dados da transação para permitir reconciliação
    IF v_order.status = 'cancelled' THEN
        SELECT * INTO v_tx FROM public.payment_transactions WHERE order_id = p_order_id LIMIT 1;
        RETURN jsonb_build_object(
            'success', true,
            'already_cancelled', true,
            'order_id', p_order_id,
            'order_status', 'cancelled',
            'transaction_status', COALESCE(v_tx.status, 'none'),
            'provider_payment_id', v_tx.provider_payment_id
        );
    END IF;

    -- 5. Proteger contra cancelamento de pedidos pagos (deve usar fluxo de reembolso)
    IF v_order.status = 'paid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pedidos já pagos não podem ser cancelados diretamente. Utilize o reembolso.'
        );
    END IF;

    -- 6. Atualizar Pedido para 'cancelled'
    UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

    -- 7. Cancelar Transação Pendente/Inicializada associada
    UPDATE public.payment_transactions
    SET
        status = 'cancelled',
        gateway_metadata = gateway_metadata || jsonb_build_object('cancel_reason', p_reason, 'cancelled_at', timezone('utc'::text, now()), 'cancelled_by', p_user_id),
        claim_id = NULL,
        claim_expires_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND status IN ('initializing', 'pending')
    RETURNING * INTO v_tx;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_status', 'cancelled',
        'transaction_status', COALESCE(v_tx.status, 'none'),
        'provider_payment_id', v_tx.provider_payment_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. acquire_refund_claim: Claim/Lease para Iniciar Reembolso no Gateway
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."acquire_refund_claim"(
    "p_order_id" "uuid",
    "p_store_id" "uuid",
    "p_user_id" "uuid",
    "p_claim_id" "uuid",
    "p_lease_seconds" integer DEFAULT 30
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_authorized BOOLEAN;
    v_order RECORD;
    v_tx RECORD;
    v_lease_until TIMESTAMPTZ;
BEGIN
    -- 1. Validar Autorização do Lojista
    SELECT EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = p_store_id
          AND (s.owner_id = p_user_id OR public.has_role(p_user_id, 'admin'::public.app_role))
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Não autorizado a reembolsar pedidos desta loja.');
    END IF;

    -- 2. Lock Pessimista no Pedido
    SELECT id, store_id, total_amount, status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Pedido não encontrado.');
    END IF;

    IF v_order.store_id <> p_store_id THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Pedido pertence a outra loja.');
    END IF;

    IF v_order.status <> 'paid' THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Apenas pedidos com status Pago podem ser reembolsados.');
    END IF;

    -- 3. Lock Pessimista na Transação de Pagamento
    SELECT *
    INTO v_tx
    FROM public.payment_transactions
    WHERE order_id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Transação de pagamento não encontrada.');
    END IF;

    -- 4. Idempotência Financeira: Se já estiver reembolsado
    IF v_tx.status = 'refunded' THEN
        RETURN jsonb_build_object(
            'acquired', false,
            'already_refunded', true,
            'status', 'refunded',
            'amount', v_tx.amount,
            'provider_payment_id', v_tx.provider_payment_id
        );
    END IF;

    IF v_tx.status <> 'approved' THEN
        RETURN jsonb_build_object('acquired', false, 'error', 'Transação não está aprovada para reembolso.');
    END IF;

    -- 5. Checagem de Concorrência (Lease Ativo)
    IF v_tx.claim_id IS NOT NULL AND v_tx.claim_expires_at > timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('acquired', false, 'is_locked', true, 'error', 'Reembolso já em processamento por outra requisição.');
    END IF;

    -- 6. Adquirir Lease Exclusivo
    v_lease_until := timezone('utc'::text, now()) + (p_lease_seconds || ' seconds')::interval;

    UPDATE public.payment_transactions
    SET
        claim_id = p_claim_id,
        claim_expires_at = v_lease_until,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_tx.id;

    RETURN jsonb_build_object(
        'acquired', true,
        'order_id', p_order_id,
        'transaction_id', v_tx.id,
        'provider_payment_id', v_tx.provider_payment_id,
        'amount', v_tx.amount,
        'claim_id', p_claim_id,
        'claim_expires_at', v_lease_until
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. finalize_refund_claim: Finalização Atômica com Guarda CAS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."finalize_refund_claim"(
    "p_order_id" "uuid",
    "p_claim_id" "uuid",
    "p_refund_id" "text",
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
    -- Atualiza APENAS se o claim corresponder exatamente (Compare-And-Swap)
    UPDATE public.payment_transactions
    SET
        status = 'refunded',
        gateway_metadata = gateway_metadata || jsonb_build_object(
            'refund_id', p_refund_id,
            'refunded_at', timezone('utc'::text, now()),
            'gateway_response', p_gateway_metadata
        ),
        claim_id = NULL,
        claim_expires_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND claim_id = p_claim_id
    RETURNING * INTO v_tx;

    IF FOUND THEN
        v_updated := true;
        -- Atualizar pedido para cancelled
        UPDATE public.orders
        SET status = 'cancelled'
        WHERE id = p_order_id;
    ELSE
        SELECT * INTO v_tx FROM public.payment_transactions WHERE order_id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', v_updated,
        'order_id', p_order_id,
        'order_status', 'cancelled',
        'transaction_status', COALESCE(v_tx.status, 'unknown'),
        'refund_id', p_refund_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. fail_refund_claim: Liberação Segura do Claim em caso de Falha no Gateway
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."fail_refund_claim"(
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
        claim_id = NULL,
        claim_expires_at = NULL,
        gateway_metadata = gateway_metadata || jsonb_build_object(
            'last_refund_error', p_error_message,
            'last_refund_attempt', timezone('utc'::text, now())
        ),
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND claim_id = p_claim_id
    RETURNING * INTO v_tx;

    RETURN jsonb_build_object(
        'success', FOUND,
        'transaction_status', COALESCE(v_tx.status, 'unknown')
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Privilégios e Permissões
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION "public"."cancel_order_atomic"("uuid", "uuid", "uuid", "text") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."cancel_order_atomic"("uuid", "uuid", "uuid", "text") TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "public"."acquire_refund_claim"("uuid", "uuid", "uuid", "uuid", integer) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."acquire_refund_claim"("uuid", "uuid", "uuid", "uuid", integer) TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "public"."finalize_refund_claim"("uuid", "uuid", "text", "jsonb") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."finalize_refund_claim"("uuid", "uuid", "text", "jsonb") TO "service_role";

REVOKE ALL ON FUNCTION "public"."fail_refund_claim"("uuid", "uuid", "text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."fail_refund_claim"("uuid", "uuid", "text") TO "service_role";
