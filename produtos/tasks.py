import requests
from celery import shared_task
from .models import Pedido
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def enviar_para_n8n(self, pedido_id, status_evento):
    """
    Task Celery para enviar o Payload do Sistema para a URL de Webhook do N8N definida na loja.
    """
    try:
        pedido = Pedido.objects.select_related('loja').get(id=pedido_id)
        webhook_url = pedido.loja.n8n_webhook_url
        
        if not webhook_url:
            return "Nenhuma URL do N8N configurada na Loja. Skip."

        produtos_lista = []
        for item in pedido.itens.all():
            produtos_lista.append({
                "nome": item.produto.nome,
                "qtd": item.quantidade
            })

        payload = {
            "pedido_id": pedido.id,
            "cliente": pedido.cliente_nome,
            "telefone": pedido.telefone,
            "itens": produtos_lista,
            "valor": float(pedido.total),
            "status": status_evento
        }

        # Timeout de 3s e envio via POST
        response = requests.post(webhook_url, json=payload, timeout=3)
        response.raise_for_status()
        
        return f"Webhook N8N [{status_evento}] Sucesso. Pedido ID: {pedido_id}"

    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao comunicar com N8N para pedido {pedido_id}: {e}")
        # Falhas no n8n NÃO podem afetar pagamento, fazemos o retry em background
        raise self.retry(exc=e)
    except Exception as e:
        logger.error(f"Erro inesperado no envio n8n: {e}")
        return str(e)

@shared_task
def liberar_estoque_expirado(pedido_id):
    """
    Verifica se o pedido não foi pago após o limite e devolve o estoque.
    """
    from django.db import transaction
    try:
        with transaction.atomic():
            pedido = Pedido.objects.select_for_update().get(id=pedido_id)
            if pedido.status_pagamento == 'PENDENTE':
                pedido.status_pagamento = 'EXPIRADO'
                pedido.save()
                
                # Devolve o estoque
                for item in pedido.itens.all():
                    produto = item.produto
                    produto.estoque += item.quantidade
                    produto.save()
                    
                logger.info(f"Pedido {pedido_id} expirado, estoque devolvido.")
                
                # Notifica o n8n sobre a expiração
                enviar_para_n8n.delay(pedido.id, "EXPIRADO")
    except Pedido.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Erro ao tentar expirar pedido {pedido_id}: {e}")
