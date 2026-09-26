-- Desabilitar RLS para permitir que o fluxo de pedidos funcione enquanto investigamos a fundo o conflito de PostgREST
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Garantir que anônimos NÃO possam ler pedidos via GRANTs (fallback de segurança)
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.order_items FROM anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
