import factory
from produtos.models import Loja, Produto, Pedido, ItemPedido

class LojaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Loja

    nome = "Loja Teste"
    slug = factory.Sequence(lambda n: f"loja-teste-{n}")
    whatsapp_numero = "5511999999999"

class ProdutoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Produto

    nome = "Produto Teste"
    marca = "Marca Teste"
    preco = 100.00
    estoque = 10
    loja = factory.SubFactory(LojaFactory)

class PedidoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Pedido

    loja = factory.SubFactory(LojaFactory)
    cliente_nome = "Cliente Teste"
    telefone = "5511888888888"
    total = 100.00
    status_pagamento = "PENDENTE"
