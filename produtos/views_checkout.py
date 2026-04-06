from django.shortcuts import render, redirect, get_object_or_404
from django.db import transaction
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Loja, Produto, Pedido, ItemPedido
from .services.pagamento import PagamentoContext
from .services.pedido_service import criar_pedido, processar_webhook_pagamento

def finalizar_carrinho(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug)
    session_cart = request.session.get('carrinho', {}).get(loja.slug, {})
    
    if request.method == "POST":
        cliente_nome = request.POST.get('nome')
        telefone = request.POST.get('telefone')
        
        if not session_cart or not cliente_nome or not telefone:
            messages.error(request, "Carrinho vazio ou dados inválidos.")
            return redirect('ver_carrinho', loja_slug=loja.slug)

        try:
            pedido = criar_pedido(loja, cliente_nome, telefone, session_cart)
        except ValueError as e:
            messages.error(request, str(e))
            return redirect('ver_carrinho', loja_slug=loja.slug)

        # Chama a Strategy Factory
        contexto_pagamento = PagamentoContext(pedido)
        resultado = contexto_pagamento.processar_pagamento()
        
        # Limpa o carrinho
        session_cart_full = request.session.get('carrinho', {})
        session_cart_full.pop(loja.slug, None)
        request.session['carrinho'] = session_cart_full

        # Dinamismo do Checkout
        if resultado['metodo'] == 'PIX MANUAL':
            # Renderiza template mostrando a chave qrcode do PIX manual
            return render(request, 'produtos/checkout_pix_manual.html', {'pedido': pedido, 'chave': resultado['chave_pix']})
        elif resultado['metodo'] in ['CHECKOUT EXTERNO', 'LINK DE PAGAMENTO']:
            # Redireciona para o gateway (ex: Hotmart, Eduzz) se existir a URL
            if resultado['redirect_url']:
                return redirect(resultado['redirect_url'])
            return render(request, 'produtos/checkout_sucesso_link.html', {'pedido': pedido})
        else:
            # GATEWAY
            return render(request, 'produtos/checkout_gateway.html', {'pedido': pedido, 'dados_transacao': resultado})
            
    return redirect('ver_carrinho', loja_slug=loja.slug)

@csrf_exempt
def webhook_pagamento(request, loja_slug):
    """ Fonte de verdade do Pagamento (API Webhook) """
    if request.method == "POST":
        loja = get_object_or_404(Loja, slug=loja_slug)
        
        assinatura_recebida = request.headers.get('X-Signature') or request.headers.get('Authorization') or request.GET.get('token')
        
        if not assinatura_recebida or assinatura_recebida != loja.webhook_token:
            return JsonResponse({'erro': 'Não autorizado / Assinatura inválida'}, status=403)
            
        import json
        try:
            payload = json.loads(request.body)
        except:
            return JsonResponse({'erro': 'JSON Inválido'}, status=400)
            
        try:
            processar_webhook_pagamento(payload)
        except Pedido.DoesNotExist:
            return JsonResponse({'erro': 'Pedido não encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=500)
            
        return JsonResponse({'status': 'Recebido com sucesso'}, status=200)
    return JsonResponse({'erro': 'Método não permitido'}, status=405)
