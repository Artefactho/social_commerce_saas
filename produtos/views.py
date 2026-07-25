from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.contrib import messages
from django.views.decorators.http import require_POST
import re
from .models import Produto, Loja

def get_loja_from_slug(loja_slug):
    if loja_slug:
        return get_object_or_404(Loja, slug=loja_slug)
    return None

def home_view(request):
    return render(request, 'landing_page.html')

from django.template.loader import get_template, TemplateDoesNotExist

def vitrine_view(request, loja_slug=None):
    loja = get_loja_from_slug(loja_slug)
    
    if not loja:
        return redirect('home_saas')

    # Garantir que temos o tema (caso o signal tenha falhado por algum motivo raro)
    from .models import TemaLoja
    tema, _ = TemaLoja.objects.get_or_create(loja=loja)
    
    produtos = Produto.objects.filter(loja=loja, ativo=True, estoque__gt=0)
    
    # Filtro por categoria
    cat_id = request.GET.get('cat')
    if cat_id:
        produtos = produtos.filter(categoria_id=cat_id)
    
    # Limite de produtos na home conforme o tema
    produtos = produtos[:tema.qtd_produtos_home]
    
    numero_whatsapp = re.sub(r'\D', '', loja.whatsapp_numero) if loja.whatsapp_numero else ""
    
    # Calcular qtd de itens no carrinho
    carrinho = request.session.get('carrinho', {}).get(loja.slug, {})
    cart_count = sum(carrinho.values())
    
    # RESOLUTOR DE LAYOUT (Lógica de Plano)
    if loja.plano == 'basic':
        # No Basic, o layout é fixo pelo template
        layout_resolvido = loja.template.layout_padrao if loja.template else 'grid'
        # No Basic, stories podem ser forçados a falso se for regra global, 
        # mas aqui respeitaremos o que o template definir (neste caso, ocultamos se desejar)
        mostrar_stories = False # Exemplo de trava backend para Basic
    else:
        layout_resolvido = tema.layout
        mostrar_stories = tema.mostrar_stories

    context = {
        'loja': loja,
        'tema': tema,
        'produtos': produtos,
        'categorias': loja.categorias.all(),
        'numero_whatsapp': numero_whatsapp,
        'cart_count': cart_count,
        'total_produtos_count': loja.produtos.all().count(),
        
        # Flags de UI resolvidas (Template não decide nada)
        'layout_resolvido': layout_resolvido,
        'mostrar_banner': tema.mostrar_banner,
        'mostrar_stories': mostrar_stories,
        'cor_primaria': tema.cor_primaria,
        'cor_secundaria': tema.cor_secundaria,
        
        # Tokens de Marca (V4 Modular)
        'alinhamento_logo': tema.alinhamento_logo,
        'fonte_familia': tema.fonte_familia,
        
        # Permissões de UI (Upsell)
        'can_change_layout': loja.plano != 'basic',
        'can_show_stories': loja.plano != 'basic',
    }
    
    # Lógica de FALLBACK de Template (Segurança SET_NULL)
    if loja.template:
        template_name = f'vitrines/{loja.template.slug}.html'
    else:
        template_name = 'vitrines/default.html'
        
    
    try:
        get_template(template_name)
    except TemplateDoesNotExist:
        template_name = 'vitrines/default.html'
        
    return render(request, template_name, context)


@require_POST
def add_carrinho(request, loja_slug, produto_id):
    loja = get_object_or_404(Loja, slug=loja_slug)
    produto = get_object_or_404(Produto, id=produto_id, loja=loja)
    
    # Estrutura do carrinho: {'loja_slug': {'produto_id': qtd}}
    session_cart = request.session.get('carrinho', {})
    loja_cart = session_cart.get(loja.slug, {})
    
    p_id_str = str(produto_id)
    if p_id_str in loja_cart:
        loja_cart[p_id_str] += 1
    else:
        loja_cart[p_id_str] = 1
        
    session_cart[loja.slug] = loja_cart
    request.session['carrinho'] = session_cart
    
    messages.success(request, f"{produto.nome} adicionado ao carrinho!")
    return redirect('vitrine_loja', loja_slug=loja.slug)

def remove_carrinho(request, loja_slug, produto_id):
    loja = get_object_or_404(Loja, slug=loja_slug)
    p_id_str = str(produto_id)
    
    session_cart = request.session.get('carrinho', {})
    loja_cart = session_cart.get(loja.slug, {})
    
    if p_id_str in loja_cart:
        del loja_cart[p_id_str]
        
    session_cart[loja.slug] = loja_cart
    request.session['carrinho'] = session_cart
    
    return redirect('ver_carrinho', loja_slug=loja.slug)

def ver_carrinho(request, loja_slug=None):
    loja = get_loja_from_slug(loja_slug)
    if not loja:
        return redirect('home')

    session_cart = request.session.get('carrinho', {})
    loja_cart = session_cart.get(loja.slug, {})
    
    itens_carrinho = []
    total_carrinho = 0
    
    for p_id_str, qtd in loja_cart.items():
        produto = get_object_or_404(Produto, id=int(p_id_str), loja=loja)
        subtotal = produto.preco * qtd
        total_carrinho += subtotal
        itens_carrinho.append({
            'produto': produto,
            'quantidade': qtd,
            'subtotal': subtotal
        })
        
    context = {
        'loja': loja,
        'itens_carrinho': itens_carrinho,
        'total_carrinho': total_carrinho,
        'numero_whatsapp': re.sub(r'\D', '', loja.whatsapp_numero) if loja.whatsapp_numero else "",
        'cart_count': sum(loja_cart.values()),
    }
    return render(request, 'produtos/carrinho.html', context)
