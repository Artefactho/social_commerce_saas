import pytest
from rest_framework import status
from rest_framework.test import APIClient
from produtos.forms_auth import MerchantSignUpForm
from .factories import LojaFactory, ProdutoFactory

@pytest.mark.django_db
def test_signup_form_valida_senha_fraca():
    """Garante que senhas fracas (ex: '123') sejam rejeitadas no formulário de cadastro."""
    form_data = {
        'username': 'novolojista',
        'email': 'novo@loja.com',
        'password': '123',
        'nome_loja': 'Loja Teste',
        'slug_loja': 'loja-nova-teste'
    }
    form = MerchantSignUpForm(data=form_data)
    assert not form.is_valid()
    assert 'password' in form.errors


@pytest.mark.django_db
def test_signup_form_bloqueia_slug_reservado():
    """Garante que slugs reservados (ex: 'admin', 'api') sejam bloqueados no cadastro."""
    form_data = {
        'username': 'novolojista',
        'email': 'novo@loja.com',
        'password': 'SenhaForteSegura123!',
        'nome_loja': 'Loja Admin',
        'slug_loja': 'admin'
    }
    form = MerchantSignUpForm(data=form_data)
    assert not form.is_valid()
    assert 'slug_loja' in form.errors


@pytest.mark.django_db
def test_api_auth_register_rejeita_senha_fraca():
    """Garante que o endpoint POST /api/auth/register/ rejeite senhas fracas."""
    client = APIClient()
    response = client.post('/api/auth/register/', {
        'username': 'user_api_test',
        'email': 'userapi@test.com',
        'password': '123'
    }, format='json')
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'detail' in response.json()


@pytest.mark.django_db
def test_add_carrinho_exige_post(client):
    """Garante que a action add_carrinho responda com 405 Method Not Allowed se chamada via GET."""
    loja = LojaFactory(slug='loja-teste-get')
    produto = ProdutoFactory(loja=loja)
    
    response = client.get(f'/{loja.slug}/add/{produto.id}/')
    assert response.status_code == 405
