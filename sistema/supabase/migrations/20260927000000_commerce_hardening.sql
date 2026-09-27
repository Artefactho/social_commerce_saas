-- ============================================================================
-- FASE 4.1 — COMMERCE HARDENING DEFINITIVO
-- Transação ACID Única, RLS Lockdown, RPC Security & Customer ON CONFLICT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HARDENING DE RLS: Revogar criação direta de pedidos via REST anônimo/autenticado
-- Apenas a Edge Function autoritativa (usando service_role) pode criar pedidos.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can create an order" ON "public"."orders";
DROP POLICY IF EXISTS "Anyone can create an order item" ON "public"."order_items";

-- Garantir que lojistas e admins possam ler os pedidos e itens de suas lojas
DROP POLICY IF EXISTS "Owners can view their orders" ON "public"."orders";
CREATE POLICY "Owners can view their orders" ON "public"."orders"
    FOR SELECT TO "authenticated"
    USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "store_id" IN (SELECT s."id" FROM "public"."stores" s WHERE s."owner_id" = "auth"."uid"())
    );

DROP POLICY IF EXISTS "Owners can view their order items" ON "public"."order_items";
CREATE POLICY "Owners can view their order items" ON "public"."order_items"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."orders" o
        JOIN "public"."stores" s ON s."id" = o."store_id"
        WHERE o."id" = "order_items"."order_id"
          AND (s."owner_id" = "auth"."uid"() OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))
    ));

-- ----------------------------------------------------------------------------
-- 2. TRANSAÇÃO ACID ÚNICA: process_order_atomic
-- Engloba todas as etapas em uma ÚNICA transação nativa do PostgreSQL.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."process_order_atomic"(
    "p_order_payload" "jsonb"
)
RETURNS "jsonb"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    v_shipping_address TEXT;
    v_shipping_zip TEXT;
    v_coupon_code TEXT;
    v_payment_method TEXT;
    v_items JSONB;

    v_store RECORD;
    v_customer_id UUID;
    v_order_id UUID;
    v_item JSONB;
    v_product RECORD;
    
    v_subtotal NUMERIC(12,2) := 0;
    v_discount NUMERIC(12,2) := 0;
    v_shipping NUMERIC(12,2) := 0;
    v_total NUMERIC(12,2) := 0;
    
    v_has_physical BOOLEAN := false;
    v_item_qty INT;
    v_item_unit_price NUMERIC(12,2);
    v_coupon RECORD;
    
    v_validated_items JSONB := '[]'::jsonb;
BEGIN
    -- 1. Extração e validação básica do payload
    v_store_id := (p_order_payload->>'store_id')::UUID;
    v_customer_name := trim(COALESCE(p_order_payload->>'customer_name', ''));
    v_customer_email := lower(trim(COALESCE(p_order_payload->>'customer_email', '')));
    v_customer_phone := trim(p_order_payload->>'customer_phone');
    v_shipping_address := trim(COALESCE(p_order_payload->>'shipping_address', 'Não informado'));
    v_shipping_zip := trim(p_order_payload->>'shipping_zip');
    v_coupon_code := upper(trim(p_order_payload->>'coupon_code'));
    v_payment_method := COALESCE(p_order_payload->>'payment_method', 'credit_card');
    v_items := p_order_payload->'items';

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'ID da loja (store_id) é obrigatório.';
    END IF;

    IF v_customer_name = '' THEN
        RAISE EXCEPTION 'Nome do cliente é obrigatório.';
    END IF;

    IF v_customer_email = '' OR position('@' in v_customer_email) = 0 THEN
        RAISE EXCEPTION 'E-mail do cliente é inválido.';
    END IF;

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'O carrinho de compras não pode estar vazio.';
    END IF;

    -- 2. Validar Loja
    SELECT id, name, slug, shipping_fee
    INTO v_store
    FROM public.stores
    WHERE id = v_store_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loja não encontrada ou inativa.';
    END IF;

    -- 3. Iterar sobre os itens com LOCK PESSIMISTA (FOR UPDATE) e validação de estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_qty := (v_item->>'quantity')::INT;
        
        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
            RAISE EXCEPTION 'Quantidade inválida para o produto %.', v_item->>'product_id';
        END IF;

        -- Lock atômico da linha do produto dentro da transação única
        SELECT id, name, price, stock_quantity, product_type, status, store_id
        INTO v_product
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
          AND store_id = v_store_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto % não encontrado nesta loja ou foi removido.', v_item->>'product_id';
        END IF;

        IF v_product.status <> 'Ativo' THEN
            RAISE EXCEPTION 'O produto "%" não está disponível para venda no momento.', v_product.name;
        END IF;

        v_item_unit_price := v_product.price;
        v_subtotal := v_subtotal + (v_item_unit_price * v_item_qty);

        -- Tratamento de estoque físico vs digital
        IF v_product.product_type = 'digital' THEN
            -- Digital: sem baixa física de estoque
            NULL;
        ELSE
            v_has_physical := true;
            IF COALESCE(v_product.stock_quantity, 0) < v_item_qty THEN
                RAISE EXCEPTION 'Estoque insuficiente para o produto "%". Disponível: %, Solicitado: %.',
                    v_product.name, COALESCE(v_product.stock_quantity, 0), v_item_qty;
            END IF;

            -- Decremento seguro dentro da transação (Rollback automático se algo falhar)
            UPDATE public.products
            SET stock_quantity = stock_quantity - v_item_qty,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_product.id;
        END IF;

        -- Armazenar item validado para inserção em order_items
        v_validated_items := v_validated_items || jsonb_build_object(
            'product_id', v_product.id,
            'product_name', v_product.name,
            'quantity', v_item_qty,
            'unit_price', v_item_unit_price
        );
    END LOOP;

    -- 4. Validação e cálculo de Cupom
    IF v_coupon_code IS NOT NULL AND v_coupon_code <> '' THEN
        SELECT id, code, discount_type, discount_value, active
        INTO v_coupon
        FROM public.coupons
        WHERE store_id = v_store_id
          AND code = v_coupon_code
          AND active = true;

        IF FOUND THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := v_subtotal * (v_coupon.discount_value / 100.0);
            ELSE
                v_discount := LEAST(v_coupon.discount_value, v_subtotal);
            END IF;
        END IF;
    END IF;

    -- 5. Cálculo do Frete
    IF v_has_physical THEN
        v_shipping := COALESCE(v_store.shipping_fee, 0);
    ELSE
        v_shipping := 0;
    END IF;

    -- 6. Total Final Autoritativo
    v_total := GREATEST(0, (v_subtotal + v_shipping - v_discount));

    -- 7. Resolução Atômica do Customer (ON CONFLICT store_id + email)
    INSERT INTO public.customers (store_id, name, email, phone)
    VALUES (v_store_id, v_customer_name, v_customer_email, v_customer_phone)
    ON CONFLICT (store_id, email)
    DO UPDATE SET
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, public.customers.phone)
    RETURNING id INTO v_customer_id;

    -- 8. Inserção do Pedido (public.orders)
    v_order_id := gen_random_uuid();
    
    INSERT INTO public.orders (
        id,
        store_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total_amount,
        payment_method,
        status
    )
    VALUES (
        v_order_id,
        v_store_id,
        v_customer_id,
        v_customer_name,
        v_customer_email,
        v_customer_phone,
        v_shipping_address || CASE WHEN v_shipping_zip IS NOT NULL AND v_shipping_zip <> '' THEN ', CEP: ' || v_shipping_zip ELSE '' END,
        v_total,
        v_payment_method,
        'pending'
    );

    -- 9. Inserção dos Itens do Pedido (public.order_items)
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price
        )
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            (v_item->>'quantity')::INT,
            (v_item->>'unit_price')::NUMERIC(12,2)
        );
    END LOOP;

    -- Retorno com os dados calculados de forma autoritativa
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'customer_id', v_customer_id,
        'store_slug', v_store.slug,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'shipping', v_shipping,
        'total_amount', v_total
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. SEGURANÇA E PRIVILÉGIOS ESTREITOS (RPC LOCKDOWN)
-- Revoga acesso público de anon e authenticated; permite APENAS service_role
-- ----------------------------------------------------------------------------

-- Revoga privilégios padrão herdados do schema public
REVOKE ALL ON FUNCTION "public"."process_order_atomic"("jsonb") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."process_order_atomic"("jsonb") TO "service_role";

-- Revoga/limpa quaisquer funções auxiliares de estoque anteriores
DROP FUNCTION IF EXISTS "public"."decrement_product_stock"("uuid", integer);
DROP FUNCTION IF EXISTS "public"."restore_product_stock"("uuid", integer);
DROP FUNCTION IF EXISTS "public"."resolve_or_create_customer"("uuid", "text", "text", "text");
