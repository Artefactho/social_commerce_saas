from django.db import models
from django.utils.crypto import get_random_string
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Template(models.Model):
    nome = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="Deve corresponder ao nome do arquivo em templates/vitrines/")
    layout_padrao = models.CharField(max_length=20, choices=[('grid', 'Grid'), ('lista', 'Lista')], default='grid')

    def delete(self, *args, **kwargs):
        """Impede a deleção se houver lojas vinculadas (Segurança SaaS)"""
        # Usamos loja_set porque não definimos related_name em Loja.template
        if self.loja_set.exists():
            from django.core.exceptions import ValidationError
            raise ValidationError(f"O template '{self.nome}' está em uso por {self.loja_set.count()} lojas e não pode ser excluído.")
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.nome

class Loja(models.Model):
    TEMA_CHOICES = [
        ('Elegante', 'Elegante (Light com Dourado)'),
        ('Moderno', 'Moderno (Cores Vivas)'),
        ('Dark', 'Dark (Fundo Escuro)'),
    ]
    
    TIPO_PAGAMENTO_CHOICES = [
        ('PIX_MANUAL', 'Pix Manual (QR Code s/ Automação)'),
        ('GATEWAY', 'Gateway Integrado (Mercado Pago, Efí)'),
        ('EXTERNO', 'Checkout Externo (Hotmart, Eduzz)'),
        ('LINK', 'Link de Pagamento Simples')
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="lojas", null=True, blank=True)
    nome = models.CharField(max_length=150, verbose_name="Nome da Loja")
    slug = models.SlugField(unique=True, help_text="Como vai ficar no link ex: /minha-loja")
    logo = models.ImageField(upload_to="logos/", blank=True, null=True, verbose_name="Logo da Loja")
    cor_principal = models.CharField(max_length=7, default="#b08d57", help_text="Cor HEX. Ex: #b08d57 (Dourado)")
    tema_escolhido = models.CharField(max_length=20, choices=TEMA_CHOICES, default='Elegante')
    whatsapp_numero = models.CharField(max_length=20, verbose_name="Número de WhatsApp", help_text="Ex: 5511999999999")
    
    # Redes Sociais
    instagram_url = models.URLField(blank=True, null=True, verbose_name="Instagram (URL)")
    facebook_url = models.URLField(blank=True, null=True, verbose_name="Facebook (URL)")
    
    subtitulo_loja = models.CharField(max_length=255, blank=True, null=True, verbose_name="Bio/Subtítulo", help_text="Frase que aparece abaixo do nome/logo")
    banner_topo = models.ImageField(upload_to="banners/", blank=True, null=True, verbose_name="Banner de Destaque")
    
    # NOVAS CONFIGURAÇÕES DE STRATEGY DE PAGAMENTO
    tipo_pagamento = models.CharField(max_length=20, choices=TIPO_PAGAMENTO_CHOICES, default='PIX_MANUAL')
    chave_pix = models.CharField(max_length=255, blank=True, null=True, help_text="Chave PIX se for PIX Manual")
    gateway_provider = models.CharField(max_length=50, blank=True, null=True, help_text="MP, ASAAS, EFI")
    gateway_token = models.CharField(max_length=255, blank=True, null=True, help_text="Token/Secret do Gateway ou URL Externo")
    webhook_token = models.CharField(max_length=100, blank=True, null=True, help_text="Auth Token de segurança do Webhook")
    n8n_webhook_url = models.URLField(blank=True, null=True, help_text="URL do n8n para onde o SaaS enviará os eventos")

    # NOVOS CAMPOS SAAS
    plano = models.CharField(
        max_length=20, 
        choices=[('basic', 'Basic'), ('pro', 'Pro'), ('master', 'Master')], 
        default='basic'
    )
    template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def can_add_product(self):
        """Validação centralizada de limite de produtos por plano"""
        count = self.produtos.count()
        if self.plano == 'basic' and count >= 10:
            return False, "Limite de 10 produtos atingido para o plano Basic."
        if self.plano == 'pro' and count >= 50:
            return False, "Limite de 50 produtos atingido para o plano Pro."
        return True, ""

    def save(self, *args, **kwargs):
        if not self.webhook_token:
            self.webhook_token = get_random_string(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome

class TemaLoja(models.Model):
    loja = models.OneToOneField(Loja, on_delete=models.CASCADE, related_name='tema')
    
    cor_primaria = models.CharField(max_length=7, default="#000000")
    cor_secundaria = models.CharField(max_length=7, default="#ffffff")
    
    mostrar_banner = models.BooleanField(default=True)
    mostrar_stories = models.BooleanField(default=True)
    
    qtd_produtos_home = models.IntegerField(default=6)
    
    layout = models.CharField(
        max_length=20,
        choices=[('grid', 'Grid'), ('lista', 'Lista')],
        default='grid'
    )
    
    # NOVOS TOKENS DE IDENTIDADE MODULAR (V4)
    ALINHAMENTO_CHOICES = [('esquerda', 'Esquerda'), ('centro', 'Centro')]
    FONTE_CHOICES = [
        ('sans', 'Moderna (Sans-Serif)'), 
        ('serif', 'Clássica (Serif)'), 
        ('modern', 'Estilizada (Modern)')
    ]
    
    alinhamento_logo = models.CharField(max_length=20, choices=ALINHAMENTO_CHOICES, default='esquerda')
    fonte_familia = models.CharField(max_length=20, choices=FONTE_CHOICES, default='sans')

    def __str__(self):
        return f"Tema - {self.loja.nome}"

class Categoria(models.Model):
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name="categorias")
    nome = models.CharField(max_length=100)
    icone = models.CharField(max_length=50, default="bi-tag", help_text="Nome do ícone Bootstrap Icons. Ex: bi-handbag")
    imagem = models.ImageField(upload_to="categorias/", blank=True, null=True, verbose_name="Imagem (Estilo Story)")
    mostrar_estilo_story = models.BooleanField(default=True, help_text="Se deve aparecer no menu de círculos")
    ordem = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.loja.nome} - {self.nome}"

    class Meta:
        verbose_name_plural = "Categorias"
        ordering = ['ordem']

class Produto(models.Model):
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name="produtos", null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True, related_name="produtos")
    nome = models.CharField(max_length=200, verbose_name="Nome do Produto")
    marca = models.CharField(max_length=150, verbose_name="Marca")
    preco = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço (R$)")
    descricao = models.TextField(verbose_name="Descrição do Produto")
    imagem = models.ImageField(upload_to="produtos/", verbose_name="Imagem", blank=True, null=True)
    estoque = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    ativo = models.BooleanField(default=True, verbose_name="Disponível para venda")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validação para formulários (Dashboard e Admin)"""
        if self.loja and self.pk is None:
            can, msg = self.loja.can_add_product()
            if not can:
                raise ValidationError(msg)

    def save(self, *args, **kwargs):
        """Garantia final forçando validação completa antes da persistência"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.marca} - {self.nome}"

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['nome']


class Pedido(models.Model):
    STATUS_PAGAMENTO = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('CANCELADO', 'Cancelado'),
        ('EXPIRADO', 'Expirado')
    ]
    loja = models.ForeignKey(Loja, related_name="pedidos", on_delete=models.CASCADE)
    cliente_nome = models.CharField(max_length=200)
    telefone = models.CharField(max_length=25)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO, default='PENDENTE')
    metodo_pagamento = models.CharField(max_length=50, blank=True, null=True)
    id_transacao_gateway = models.CharField(max_length=200, blank=True, null=True, unique=True)
    expira_em = models.DateTimeField(blank=True, null=True, help_text="Timestamp para expiração do bloqueio de estoque")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pedido #{self.id} - {self.loja.nome} - {self.cliente_nome}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='itens', on_delete=models.CASCADE)
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.IntegerField()
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.quantidade * self.preco_unitario


# SINAIS PARA CRIAÇÃO AUTOMÁTICA DE TEMA
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Loja)
def create_tema_loja(sender, instance, created, **kwargs):
    """Garante que toda loja tenha um tema associado (idempotente)"""
    TemaLoja.objects.get_or_create(loja=instance)

