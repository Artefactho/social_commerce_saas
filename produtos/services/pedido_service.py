from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from produtos.models import Produto, Pedido, ItemPedido
from produtos.tasks import enviar_para_n8n, liberar_estoque_expirado

def criar_pedido(loja, cliente_nome, telefone, itens_carinho):
    """
    Cria um pedido, bloqueia estoque e agenda tarefas de expiração.
    itens_carinho: dict {produto_id: quantidade}
    """
    with transaction.atomic():
        total = 0
        itens_to_create = []
        
        for p_id, qtd in itens_carinho.items():
            # select_for_update() garante consistência em bancos como Postgres. No SQLite é ignorado.
            produto = Produto.objects.select_for_update().get(id=int(p_id), loja=loja)
            if produto.estoque < qtd:
                raise ValueError(f"Estoque insuficiente para {produto.nome}.")
            
            subtotal = produto.preco * qtd
            total += subtotal
            
            # Bloqueio de estoque
            produto.estoque -= qtd
            produto.save()
            
            itens_to_create.append({
                'produto': produto,
                'quantidade': qtd,
                'preco_unitario': produto.preco
            })

        expiracao_tempo = timezone.now() + timedelta(minutes=15)
        
        pedido = Pedido.objects.create(
            loja=loja,
            cliente_nome=cliente_nome,
            telefone=telefone,
            total=total,
            status_pagamento='PENDENTE',
            expira_em=expiracao_tempo
        )
        
        for item in itens_to_create:
            ItemPedido.objects.create(
                pedido=pedido,
                produto=item['produto'],
                quantidade=item['quantidade'],
                preco_unitario=item['preco_unitario']
            )

    # Dispara automações (Envolto em try/except para não quebrar a transação se o Redis falhar)
    try:
        enviar_para_n8n.delay(pedido.id, "CRIADO")
        liberar_estoque_expirado.apply_async((pedido.id,), countdown=15*60)
    except Exception as e:
        # Em produção, aqui logaríamos o erro no Sentry ou similar
        print(f"Erro ao disparar tarefa Celery: {e}")
    
    return pedido

def processar_webhook_pagamento(payload):
    """
    Processa o status do pagamento vindo do gateway.
    payload deve conter 'id' (da transação no gateway) ou 'pedido_id' (interno) e 'status'.
    """
    transacao_id = payload.get('id') or payload.get('id_transacao')
    pedido_id = payload.get('pedido_id')
    status = payload.get('status') # 'approved', 'PAGO', etc.
    
    if pedido_id:
        pedido = Pedido.objects.get(id=pedido_id)
    else:
        pedido = Pedido.objects.get(id_transacao_gateway=transacao_id)
        
    # Idempotência e Confirmação
    if (status in ['approved', 'PAGO']) and pedido.status_pagamento != 'PAGO':
        with transaction.atomic():
            pedido.status_pagamento = 'PAGO'
            pedido.save()
            
        # Evento N8N
        enviar_para_n8n.delay(pedido.id, "PAGO")
        return True
    
    return False
