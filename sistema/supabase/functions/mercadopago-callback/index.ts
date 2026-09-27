import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const siteUrl = Deno.env.get("FRONTEND_URL") || Deno.env.get("SITE_URL") || "http://localhost:8080";

  if (error || !code || !state) {
    console.error("Erro no callback OAuth do Mercado Pago:", error || "Parâmetros code ou state ausentes");
    return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_error=${encodeURIComponent(error || "missing_params")}`, 302);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID") ?? "";
    const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET") ?? "";
    const redirectUri = Deno.env.get("MERCADOPAGO_REDIRECT_URI") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validar e consumir state atomicamente (Uso Único)
    const { data: stateRow, error: stateErr } = await supabase
      .from("mercadopago_oauth_states")
      .select("*")
      .eq("state", state)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (stateErr || !stateRow) {
      console.warn("Tentativa de uso de state inválido ou expirado:", state);
      return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_error=invalid_state`, 302);
    }

    // Invalidação imediata do state
    await supabase
      .from("mercadopago_oauth_states")
      .update({ used: true })
      .eq("id", stateRow.id);

    // 2. Trocar code por tokens no Mercado Pago
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("Mercado Pago rejeitou a troca do code:", tokenJson);
      return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_error=token_exchange_failed`, 302);
    }

    const expiresInSeconds = tokenJson.expires_in || 15552000;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // 3. Persistir tokens com segurança na conexão da loja (store_payment_connections)
    const { error: upsertErr } = await supabase
      .from("store_payment_connections")
      .upsert(
        {
          store_id: stateRow.store_id,
          provider: "mercadopago",
          provider_user_id: String(tokenJson.user_id),
          access_token: tokenJson.access_token,
          refresh_token: tokenJson.refresh_token,
          public_key: tokenJson.public_key,
          token_type: tokenJson.token_type || "bearer",
          scope: tokenJson.scope,
          expires_at: expiresAt,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" }
      );

    if (upsertErr) {
      console.error("Erro ao persistir conexão de pagamento no banco:", upsertErr);
      return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_error=db_save_failed`, 302);
    }

    // 4. Redirecionar lojista para o painel com sucesso
    return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_success=connected`, 302);
  } catch (err) {
    console.error("Erro inesperado no callback do Mercado Pago:", err);
    return Response.redirect(`${siteUrl}/dashboard?tab=settings&mp_error=server_error`, 302);
  }
});
