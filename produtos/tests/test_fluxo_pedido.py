import pytest
from produtos.models import Pedido, Produto
from produtos.services.pedido_service import criar_pedido, processar_webhook_pagamento
from produtos.tasks import liberar_estoque_expirado
from .factories import LojaFactory, ProdutoFactory, PedidoFactory
import threading

@pytest.mark.django_db
def test_criar_pedido_bloqueia_estoque():
    loja = LojaFactory()
    produto = ProdutoFactory(loja=loja, estoque=10)
    
    # Simula o carrinho: {id_produto: quantidade}
    itens_carinho = {str(produto.id): 2}
    
    pedido = criar_pedido(
        loja=loja,
        cliente_nome="Teste Cliente",
        telefone="5511999999999",
        itens_carinho=itens_carinho
    )
    
    produto.refresh_from_db()
    
    assert pedido.status_pagamento == "PENDENTE"
    assert produto.estoque == 8
    assert pedido.itens.count() == 1

@pytest.mark.django_db
def test_pagamento_muda_status():
    pedido = PedidoFactory(status_pagamento="PENDENTE")
    
    payload = {
        "pedido_id": pedido.id,
        "status": "PAGO"
    }
    
    processar_webhook_pagamento(payload)
    
    pedido.refresh_from_db()
    
    assert pedido.status_pagamento == "PAGO"

@pytest.mark.django_db
def test_expiracao_pedido_devolve_estoque():
    loja = LojaFactory()
    produto = ProdutoFactory(loja=loja, estoque=10)
    itens_carinho = {str(produto.id): 3}
    
    pedido = criar_pedido(loja, "Cliente", "123", itens_carinho)
    
    produto.refresh_from_db()
    assert produto.estoque == 7
    
    # Chama a função de expiração diretamente (fora do celery worker)
    liberar_estoque_expirado(pedido.id)
    
    pedido.refresh_from_db()
    produto.refresh_from_db()
    
    assert pedido.status_pagamento == "EXPIRADO"
    assert produto.estoque == 10

@pytest.mark.django_db
def test_webhook_idempotente():
    pedido = PedidoFactory(status_pagamento="PENDENTE")
    
    payload = {
        "pedido_id": pedido.id,
        "status": "PAGO"
    }
    
    # Primeiro envio
    processar_webhook_pagamento(payload)
    assert Pedido.objects.get(id=pedido.id).status_pagamento == "PAGO"
    
    # Segundo envio (duplicado)
    processar_webhook_pagamento(payload)
    
    pedido.refresh_from_db()
    assert pedido.status_pagamento == "PAGO"

@pytest.mark.django_db
@pytest.mark.skip(reason="Race conditions are hard to test in non-transactional SQLite without blocking threads")
def test_race_condition():
    pass
