from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib import messages
from .models import Loja, Pedido, Produto, Categoria
from django.db.models import Sum, Count
from .forms import ProdutoForm
from .forms_config import LojaConfigForm
from .forms_auth import MerchantSignUpForm
from django.contrib.admin.views.decorators import staff_member_required
from django.db import models # Para Q objects no saas_admin
import requests
import json

@login_required
def agentes_ia(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    from .models import TemaLoja
    tema, _ = TemaLoja.objects.get_or_create(loja=loja)
    
    context = {
        'loja': loja,
        'tema': tema,
        'agentes': [
            {'id': 'copy', 'nome': 'Copywriter Pro', 'icon': 'bi-pen-fill', 'desc': 'Gera textos de venda irresistíveis.'},
            {'id': 'sales', 'nome': 'Estrategista de Vendas', 'icon': 'bi-graph-up-arrow', 'desc': 'Dicas de como vender mais hoje.'}
        ]
    }
    return render(request, 'produtos/agentes.html', context)

from django.http import JsonResponse
import time

@login_required
def simular_agente(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        agente_id = data.get('agente_id')
        prompt = data.get('prompt', '').lower()
        
        # Simulação de "Pensamento" da IA
        time.sleep(1) 
        
        if agente_id == 'copy':
            resposta = f"Com base no seu pedido '{prompt}', aqui está uma sugestão de copy de alta conversão:\n\n🚀 **DESCUBRA O PODER DA FRAGRÂNCIA**\n\nVocê não está apenas comprando um perfume, está adquirindo uma nova identidade. Nossa fórmula exclusiva garante fixação de 12h e uma silagem que impressiona.\n\n✅ *Oferta Exclusiva: Frete Grátis para as próximas 2 horas!*"
        elif agente_id == 'sales':
            resposta = f"Analisando sua pergunta sobre '{prompt}', meu conselho estratégico é:\n\nFoque em **Escassez e Urgência**. Notei que seus produtos têm bom tráfego mas poucos cliques no checkout. Adicione um contador regressivo na página de produto para aumentar a conversão em até 23%."
        else:
            resposta = "Desculpe, sou um agente em treinamento e ainda não sei processar esse pedido específico."
            
        return JsonResponse({'success': True, 'resposta': resposta})
    return JsonResponse({'success': False, 'error': 'Método não permitido'}, status=405)

def signup_merchant(request):
    if request.method == 'POST':
        form = MerchantSignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            loja = user.lojas.first()
            messages.success(request, f"Loja {loja.nome} criada com sucesso! Boas-vindas!")
            return redirect('dashboard_loja', loja_slug=loja.slug)
    else:
        form = MerchantSignUpForm()
    return render(request, 'registration/signup.html', {'form': form})

from django.utils import timezone

@login_required
def dashboard_loja(request, loja_slug):
    # SEGURANÇA: Garantir que o usuário só acessa a PRÓPRIA loja
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    
    # Estatísticas
    pedidos = Pedido.objects.filter(loja=loja)
    
    # HOJE
    hoje = timezone.now().date()
    vendas_hoje = pedidos.filter(criado_em__date=hoje, status_pagamento='PAGO')
    total_hoje_valor = vendas_hoje.aggregate(Sum('total'))['total__sum'] or 0
    total_hoje_count = vendas_hoje.count()

    # GERAL
    total_vendas = pedidos.filter(status_pagamento='PAGO').aggregate(Sum('total'))['total__sum'] or 0
    total_pedidos = pedidos.count()
    pedidos_pendentes = pedidos.filter(status_pagamento='PENDENTE').count()
    
    # Dados para gráficos/listas
    ultimos_pedidos = pedidos.order_by('-criado_em')[:10]
    total_produtos = Produto.objects.filter(loja=loja).count()
    total_categorias = Categoria.objects.filter(loja=loja).count()
    
    context = {
        'loja': loja,
        'total_hoje_valor': total_hoje_valor,
        'total_hoje_count': total_hoje_count,
        'total_vendas': total_vendas,
        'total_pedidos': total_pedidos,
        'pedidos_pendentes': pedidos_pendentes,
        'ultimos_pedidos': ultimos_pedidos,
        'total_produtos': total_produtos,
        'total_categorias': total_categorias,
    }
    
    return render(request, 'produtos/dashboard.html', context)

@login_required
def preparar_dashboard_v2(request):
    # Atalho para o lojista ir para sua loja principal
    loja = request.user.lojas.first()
    if loja:
        return redirect('dashboard_loja', loja_slug=loja.slug)
    return redirect('signup_merchant')

@login_required
def configurar_loja(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    
    if request.method == 'POST':
        form = LojaConfigForm(request.POST, request.FILES, instance=loja)
        if form.is_valid():
            form.save()
            messages.success(request, "Configurações da loja atualizadas com sucesso!")
            return redirect('dashboard_loja', loja_slug=loja.slug)
    else:
        form = LojaConfigForm(instance=loja)
        
    return render(request, 'produtos/loja_config.html', {'loja': loja, 'form': form})

@login_required
def atualizar_status_pedido(request, loja_slug, pedido_id):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    pedido = get_object_or_404(Pedido, id=pedido_id, loja=loja)
    
    novo_status = request.POST.get('status')
    if novo_status:
        pedido.status_pagamento = novo_status
        pedido.save()
        messages.success(request, f"Status do pedido #{pedido.id} atualizado para {novo_status.upper()}.")
    
    return redirect('dashboard_loja', loja_slug=loja.slug)

@login_required
def meus_produtos(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    produtos = Produto.objects.filter(loja=loja).order_by('-id')
    return render(request, 'produtos/meus_produtos.html', {'loja': loja, 'produtos': produtos})

@login_required
def adicionar_produto(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    
    if request.method == 'POST':
        form = ProdutoForm(request.POST, request.FILES, loja=loja)
        if form.is_valid():
            try:
                produto = form.save(commit=False)
                produto.loja = loja
                produto.save()
                messages.success(request, "Produto cadastrado com sucesso!")
                return redirect('meus_produtos', loja_slug=loja.slug)
            except Exception as e:
                messages.error(request, str(e))
    else:
        form = ProdutoForm(loja=loja)
        
    return render(request, 'produtos/add_produto.html', {'loja': loja, 'form': form, 'titulo': 'Adicionar Produto'})

@login_required
def editar_produto(request, loja_slug, produto_id):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    produto = get_object_or_404(Produto, id=produto_id, loja=loja)
    
    if request.method == 'POST':
        form = ProdutoForm(request.POST, request.FILES, instance=produto, loja=loja)
        if form.is_valid():
            form.save()
            messages.success(request, "Produto atualizado com sucesso!")
            return redirect('meus_produtos', loja_slug=loja.slug)
    else:
        form = ProdutoForm(instance=produto, loja=loja)
        
    return render(request, 'produtos/add_produto.html', {'loja': loja, 'form': form, 'titulo': 'Editar Produto'})

@login_required
def pedido_detalhe(request, loja_slug, pedido_id):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    pedido = get_object_or_404(Pedido, id=pedido_id, loja=loja)
    return render(request, 'produtos/pedido_detalhe.html', {'loja': loja, 'pedido': pedido})

@login_required
def deletar_produto(request, loja_slug, produto_id):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    produto = get_object_or_404(Produto, id=produto_id, loja=loja)
    produto.delete()
    messages.success(request, "Produto removido com sucesso!")
    return redirect('meus_produtos', loja_slug=loja.slug)

@login_required
def editar_template(request, loja_slug):
    loja = get_object_or_404(Loja, slug=loja_slug, owner=request.user)
    # Garantir existência do tema
    from .models import TemaLoja, Template
    tema, _ = TemaLoja.objects.get_or_create(loja=loja)
    templates_disponiveis = Template.objects.all()
    
    if request.method == 'POST':
        # Campos básicos permitidos para todos
        template_id = request.POST.get('template_id')
        if template_id:
            try:
                loja.template = Template.objects.get(id=template_id)
                loja.save()
            except Template.DoesNotExist:
                pass

        tema.cor_primaria = request.POST.get('cor_primaria', tema.cor_primaria)
        tema.cor_secundaria = request.POST.get('cor_secundaria', tema.cor_secundaria)
        tema.mostrar_banner = 'mostrar_banner' in request.POST
        
        # Correção para QTD Produtos (evita crash se vier vazio)
        qtd = request.POST.get('qtd_produtos_home')
        try:
            tema.qtd_produtos_home = int(qtd) if qtd else 6
        except (ValueError, TypeError):
            tema.qtd_produtos_home = 6

        
        # Bloqueio de BACKEND para plano Basic
        if loja.plano != 'basic':
            tema.mostrar_stories = 'mostrar_stories' in request.POST
            tema.layout = request.POST.get('layout', 'grid')
            tema.alinhamento_logo = request.POST.get('alinhamento_logo', 'esquerda')
            tema.fonte_familia = request.POST.get('fonte_familia', 'sans')
        else:
            # Forçar valores padrão do template se for basic (Segurança)
            tema.mostrar_stories = False
            tema.layout = loja.template.layout_padrao if loja.template else 'grid'
            tema.alinhamento_logo = 'esquerda'
            tema.fonte_familia = 'sans'
        
        tema.save()
        messages.success(request, f"🎨 Aparência da loja '{loja.nome}' atualizada! Template atual: {loja.template.nome if loja.template else 'Padrão'}")
        
        # Se for um lojista comum, manda pro dashboard. Se for admin, volta pro tema or admin
        if request.user.is_staff and 'admin' in request.path:
             return redirect('saas_admin')
        return redirect('dashboard_loja', loja_slug=loja.slug)
        
    return render(request, 'produtos/editar_template.html', {
        'loja': loja, 
        'tema': tema,
        'templates_disponiveis': templates_disponiveis,
        'can_edit_pro': loja.plano != 'basic'
    })

@staff_member_required
def saas_admin(request):
    from .models import Template
    # Annotate para métricas rápidas no painel do dono do SaaS
    lojas = Loja.objects.annotate(
        num_produtos=Count('produtos', distinct=True),
        vendas_totais=Sum('pedidos__total', filter=models.Q(pedidos__status_pagamento='PAGO'))
    ).order_by('-criado_em')
    
    templates = Template.objects.all()
    
    if request.method == 'POST':
        loja_id = request.POST.get('loja_id')
        novo_plano = request.POST.get('plano')
        template_id = request.POST.get('template_id')
        
        loja_obj = get_object_or_404(Loja, id=loja_id)
        
        if novo_plano:
            loja_obj.plano = novo_plano
            
        if template_id:
            template_obj = get_object_or_404(Template, id=template_id)
            loja_obj.template = template_obj
            
        loja_obj.save()
        messages.success(request, f"🚀 Loja {loja_obj.nome} atualizada! Plano: {loja_obj.plano.upper()} | Template: {loja_obj.template.nome if loja_obj.template else 'Nenhum'}")
        return redirect('saas_admin')

    return render(request, 'admin/admin_lojas.html', {'lojas': lojas, 'templates': templates})
