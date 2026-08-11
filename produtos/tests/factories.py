import factory
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from produtos.models import Loja, Produto, Pedido, ItemPedido, Plan, Account, Subscription, AccountUser

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.Sequence(lambda n: f"user_{n}@example.com")

class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan
        django_get_or_create = ('nome',)

    nome = "basic"
    max_lojas = 1
    max_produtos_por_loja = 10
    max_usuarios = 1
    preco_mensal = 0

class AccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Account

    nome = factory.Sequence(lambda n: f"Account {n}")

class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    account = factory.SubFactory(AccountFactory)
    plan = factory.SubFactory(PlanFactory)
    status = 'active'

class AccountUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AccountUser

    account = factory.SubFactory(AccountFactory)
    user = factory.SubFactory(UserFactory)
    role = 'owner'
    status = 'active'

class LojaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Loja

    account = factory.SubFactory(AccountFactory)
    owner = factory.SubFactory(UserFactory)
    nome = "Loja Teste"
    slug = factory.Sequence(lambda n: f"loja-teste-{n}")
    whatsapp_numero = "5511999999999"

    @factory.post_generation
    def plano(self, create, extracted, **kwargs):
        if not create:
            return
        
        try:
            sub = self.account.subscription
            if extracted:
                max_produtos = 50 if extracted == 'pro' else (999 if extracted == 'master' else 10)
                max_lojas_val = 3 if extracted == 'pro' else (10 if extracted == 'master' else 1)
                plan, _ = Plan.objects.get_or_create(
                    nome=extracted,
                    defaults={
                        'max_lojas': max_lojas_val,
                        'max_produtos_por_loja': max_produtos,
                        'max_usuarios': 5 if extracted == 'pro' else 1,
                        'preco_mensal': 49.90 if extracted == 'pro' else 0,
                    }
                )
                sub.plan = plan
                sub.save()
        except ObjectDoesNotExist:
            plan_name = extracted or 'basic'
            max_produtos = 50 if plan_name == 'pro' else (999 if plan_name == 'master' else 10)
            max_lojas_val = 3 if plan_name == 'pro' else (10 if plan_name == 'master' else 1)
            plan, _ = Plan.objects.get_or_create(
                nome=plan_name,
                defaults={
                    'max_lojas': max_lojas_val,
                    'max_produtos_por_loja': max_produtos,
                    'max_usuarios': 5 if plan_name == 'pro' else 1,
                    'preco_mensal': 49.90 if plan_name == 'pro' else 0,
                }
            )
            Subscription.objects.create(account=self.account, plan=plan, status='active')

        if self.owner and not AccountUser.objects.filter(account=self.account, user=self.owner).exists():
            AccountUser.objects.create(account=self.account, user=self.owner, role='owner')

        self.account.refresh_from_db()

class ProdutoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Produto

    nome = "Produto Teste"
    marca = "Marca Teste"
    descricao = "Descrição de teste para o produto"
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
