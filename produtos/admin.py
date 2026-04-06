from django.contrib import admin
from .models import Produto, Loja, Pedido, ItemPedido

@admin.register(Loja)
class LojaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'slug', 'tema_escolhido')
    prepopulated_fields = {"slug": ("nome",)}

@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'loja', 'marca', 'preco', 'estoque', 'ativo')
    list_filter = ('loja', 'marca', 'ativo')
    search_fields = ('nome', 'marca', 'descricao')
    list_editable = ('preco', 'estoque', 'ativo')

class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ('produto', 'quantidade', 'preco_unitario', 'subtotal')
    can_delete = False

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'loja', 'cliente_nome', 'telefone', 'total', 'status_pagamento', 'metodo_pagamento', 'criado_em')
    list_filter = ('loja', 'status_pagamento', 'metodo_pagamento', 'criado_em')
    search_fields = ('cliente_nome', 'telefone', 'id_transacao_gateway')
    inlines = [ItemPedidoInline]
    readonly_fields = ('criado_em', 'atualizado_em')
