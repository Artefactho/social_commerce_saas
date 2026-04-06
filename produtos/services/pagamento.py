from abc import ABC, abstractmethod
import requests

class PagamentoStrategy(ABC):
    @abstractmethod
    def processar(self, pedido):
        """Método principal para iniciar o fluxo de pagamento"""
        pass

class PixManualStrategy(PagamentoStrategy):
    def processar(self, pedido):
        # Gera QRCode/Metadados sem automação
        return {
            'status': 'PENDENTE',
            'metodo': 'PIX MANUAL',
            'chave_pix': pedido.loja.chave_pix,
            'mensagem': 'Aguardando pagamento manual e envio do comprovante.',
            'redirect_url': None
        }

class GatewayStrategy(PagamentoStrategy):
    def processar(self, pedido):
        # Implementação para Mercado Pago, Efí ou Asaas.
        # Integração API com gateway usando pedido.loja.gateway_token
        # Aqui ficará o payload real quando integrar os SDKs oficiais
        return {
            'status': 'AGUARDANDO_GATEWAY',
            'metodo': 'PIX DINAMICO',
            'id_transacao_externa': f"SIMULADO_MP_{pedido.id}",
            'redirect_url': '#', # O ideal é a URL do checkout MP
            'qr_code_base64': 'qr_code_gerado_dummy'
        }

class CheckoutExternoStrategy(PagamentoStrategy):
    def processar(self, pedido):
        # Redireciona para Eduzz, Hotmart, Monetizze apontando para o produto
        return {
            'status': 'PENDENTE',
            'metodo': 'CHECKOUT EXTERNO',
            'redirect_url': pedido.loja.gateway_token # Assumindo que aqui a loja salva a URL da Hotmart
        }

class LinkPagamentoStrategy(PagamentoStrategy):
    def processar(self, pedido):
        # Gera o link de pagamento simples e devolve
        return {
            'status': 'PENDENTE',
            'metodo': 'LINK DE PAGAMENTO',
            'redirect_url': pedido.loja.gateway_token # O token serve como link também nesta estratégia
        }

class PagamentoContext:
    """Contexto que decide e roda a estratégia correta"""
    def __init__(self, pedido):
        self.pedido = pedido
        tipo = pedido.loja.tipo_pagamento
        
        if tipo == 'PIX_MANUAL':
            self._strategy = PixManualStrategy()
        elif tipo == 'GATEWAY':
            self._strategy = GatewayStrategy()
        elif tipo == 'EXTERNO':
            self._strategy = CheckoutExternoStrategy()
        elif tipo == 'LINK':
            self._strategy = LinkPagamentoStrategy()
        else:
            self._strategy = PixManualStrategy()

    def processar_pagamento(self):
        return self._strategy.processar(self.pedido)
