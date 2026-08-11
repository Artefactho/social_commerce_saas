import pytest
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from rest_framework import status
from rest_framework.test import APIClient
from produtos.models import Produto, Pedido
from produtos.services.pedido_service import criar_pedido
from .factories import LojaFactory, ProdutoFactory, UserFactory

@pytest.mark.django_db
def test_criar_pedido_impedir_compra_cross_tenant():
    """
    Garante que uma loja (Loja A) não possa processar pedidos nem debitar
    estoque de produtos pertencentes a outra loja (Loja B).
    """
    loja_a = LojaFactory(nome="Loja A", slug="loja-a")
    loja_b = LojaFactory(nome="Loja B", slug="loja-b")
    
    produto_b = ProdutoFactory(loja=loja_b, nome="Produto B", estoque=10, preco=100.00)
    
    itens_carinho_cross = {str(produto_b.id): 2}
    
    # Tenta criar um pedido na Loja A usando o produto da Loja B
    with pytest.raises(ObjectDoesNotExist):
        criar_pedido(
            loja=loja_a,
            cliente_nome="Cliente Atacante",
            telefone="5511999999999",
            itens_carinho=itens_carinho_cross
        )
    
    # Valida que o estoque do produto da Loja B não foi alterado
    produto_b.refresh_from_db()
    assert produto_b.estoque == 10
    assert Pedido.objects.count() == 0


@pytest.mark.django_db
def test_ver_carrinho_impedir_produto_cross_tenant(client):
    """
    Garante que acessar o carrinho de uma loja com ID de produto de outra loja
    retorne Http404 em vez de carregar dados cruzados.
    """
    loja_a = LojaFactory(nome="Loja A", slug="loja-a")
    loja_b = LojaFactory(nome="Loja B", slug="loja-b")
    produto_b = ProdutoFactory(loja=loja_b, nome="Produto B", preco=50.00)
    
    # Simula sessão com produto da Loja B injetado no carrinho da Loja A
    session = client.session
    session['carrinho'] = {
        loja_a.slug: {str(produto_b.id): 1}
    }
    session.save()
    
    response = client.get(f"/{loja_a.slug}/carrinho/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_auth_me_sem_erro_status():
    """
    Garante que o endpoint GET /api/users/me/ retorne 200 OK e os dados da loja
    sem levantar AttributeError devido à chave 'status'.
    """
    user = UserFactory()
    loja = LojaFactory(owner=user, nome="Loja Teste", slug="loja-teste", plano="basic")
    
    api_client = APIClient()
    api_client.force_authenticate(user=user)
    
    response = api_client.get('/api/users/me/')
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data['user']['username'] == user.username
    assert len(data['lojas_gerenciadas']) == 1
    
    loja_info = data['lojas_gerenciadas'][0]
    assert loja_info['id'] == loja.id
    assert loja_info['slug'] == loja.slug
    assert loja_info['nome'] == loja.nome
    assert loja_info['plano'] == "basic"
    assert 'status' not in loja_info


@pytest.mark.django_db
def test_plano_basic_bloqueia_segunda_loja():
    """
    Garante que um usuário com plano Basic (max_lojas=1) não consiga criar uma segunda loja.
    """
    from produtos.models import can_add_loja
    user = UserFactory()
    loja1 = LojaFactory(owner=user, nome="Loja 1", slug="loja-1", plano="basic")
    account = loja1.account

    can, msg = can_add_loja(account)
    assert can is False
    assert "Limite de 1 loja(s) atingido" in msg


@pytest.mark.django_db
def test_plano_pro_permite_multiplas_lojas_mesma_assinatura():
    """
    Garante que um usuário com plano Pro (max_lojas=3) consegue ter Loja de Perfumes e
    Loja de Lingerie sob a MESMA assinatura (mesmo account_id).
    """
    from produtos.models import can_add_loja
    user = UserFactory()
    loja_perfumes = LojaFactory(owner=user, nome="Loja de Perfumes", slug="perfumes", plano="pro")
    account = loja_perfumes.account

    can, msg = can_add_loja(account)
    assert can is True

    loja_lingerie = LojaFactory(account=account, owner=user, nome="Loja de Lingerie", slug="lingerie")

    assert account.lojas.count() == 2
    assert loja_perfumes.account_id == loja_lingerie.account_id
    assert loja_perfumes.plano == "pro"
    assert loja_lingerie.plano == "pro"
