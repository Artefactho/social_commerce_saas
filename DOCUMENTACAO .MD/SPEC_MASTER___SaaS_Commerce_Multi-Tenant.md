# SaaS COMMERCE — SPEC MASTER
## Especificação completa de produto, arquitetura e execução

**Versão:** 1.0  
**Status:** Documento mestre de implementação  
**Projeto:** SaaS Commerce / Social Commerce  
**Tema inicial:** Aura Maison  
**Objetivo:** Construir uma plataforma SaaS multi-tenant de criação e gestão de lojas sociais, catálogos e vendas, preparada para milhares de usuários sem perda de isolamento, segurança ou desempenho.

**Stack / Arquitetura:** Este projeto será desenvolvido **do zero**, utilizando o Claude Code como agente principal de desenvolvimento.

Não assumir Lovable, código gerado por Lovable, Supabase ou qualquer arquitetura pré-existente como base do produto. Supabase **não é obrigatório**.

A stack definitiva deve ser escolhida durante a fase de arquitetura (seção 79), considerando: segurança multi-tenant, escalabilidade, custo, performance, facilidade de manutenção, isolamento de dados, autenticação, storage, pagamentos, suporte a milhares de lojas, desacoplamento do Theme Engine e facilidade de desenvolvimento pelo próprio Claude Code.

O Claude Code não deve escolher uma tecnologia por familiaridade. Deve apresentar a arquitetura recomendada, comparar opções (frontend, backend, database, auth, storage, cache, queue, deploy) e justificar as decisões antes de qualquer linha de código ser escrita. Após aprovação, a implementação começa do zero.

**Modelo de negócio — importante para não confundir camadas:**

```text
SaaS Commerce (esta plataforma)
 └── Cobra ASSINATURA dos lojistas (planos BÁSICO/PRO/MASTER)
 └── NÃO tem frete, produto físico ou estoque próprio
 └── Billing = Subscription + Plan (seções 29, 68)

Loja do lojista (tenant)
 └── Vende produtos FÍSICOS e/ou DIGITAIS para os clientes finais dele
 └── Frete se aplica SOMENTE a produtos físicos, por loja (seção 16.3)
 └── Infoprodutos/produtos digitais nunca exigem frete
```

Ou seja: frete é uma regra do **Commerce Core** (nível loja/produto), nunca uma regra do faturamento do SaaS.

---

# ÍNDICE

**Parte I — Visão e Princípios**
[1. Visão do Produto](#1-visão-do-produto) · [2. Princípios Fundamentais](#2-princípios-fundamentais) · [3. Estrutura Geral do Produto](#3-estrutura-geral-do-produto)

**Parte II — Site Institucional e Onboarding**
[4. Site Institucional](#4-site-institucional) · [5. Página de Planos](#5-página-de-planos) · [6. Autenticação](#6-autenticação) · [7. Onboarding](#7-onboarding) · [8. Modelo de Usuário e Organização](#8-modelo-de-usuário-e-organização)

**Parte III — Painel do Cliente**
[9. Painel do Cliente](#9-painel-do-cliente) · [10. Dashboard do Cliente](#10-dashboard-do-cliente) · [11. Gerenciamento de Lojas](#11-gerenciamento-de-lojas) · [12. Slug da Loja](#12-slug-da-loja)

**Parte IV — Commerce Core**
[13. Produtos](#13-produtos) · [14. Categorias](#14-categorias) · [15. Clientes](#15-clientes) · [16. Pedidos](#16-pedidos) · [16.1 Carrinho](#161-carrinho) · [16.2 Cupons e Descontos](#162-cupons-e-descontos) · [16.3 Frete (regra condicional)](#163-frete-regra-condicional-por-tipo-de-produto) · [16.4 Cancelamento e Reembolso](#164-cancelamento-e-reembolso) · [17. Checkout](#17-checkout) · [18. Pix](#18-pix) · [19. WhatsApp](#19-whatsapp)

**Parte V — Theme Engine**
[20. Sistema de Templates](#20-sistema-de-templates) · [21. Theme Contract](#21-theme-contract) · [22. Configuração do Tema](#22-configuração-do-tema) · [23. Aura Maison](#23-aura-maison) · [24. Menus](#24-menus) · [25. Banner](#25-banner) · [26. Customizador](#26-customizador) · [27. Templates por Plano](#27-templates-por-plano)

**Parte VI — Planos e Limites**
[28. Feature Flags](#28-feature-flags) · [29. Assinaturas](#29-assinaturas) · [30. Controle de Limites](#30-controle-de-limites)

**Parte VII — Painel Administrativo do SaaS**
[31. Painel Administrativo do SaaS](#31-painel-administrativo-do-saas) · [32. Segurança do Admin](#32-segurança-do-admin) · [33. Painel de Usuários](#33-painel-de-usuários) · [34. Painel de Organizações](#34-painel-de-organizações) · [35. Painel de Lojas](#35-painel-de-lojas) · [36. Painel de Planos](#36-painel-de-planos) · [37. Dashboard Administrativo](#37-dashboard-administrativo) · [38. Auditoria](#38-auditoria) · [38.1 LGPD e Privacidade](#381-lgpd-e-privacidade)

**Parte VIII — Segurança e Multi-Tenancy**
[39. Isolamento Multi-Tenant](#39-isolamento-multi-tenant) · [40. RLS / Autorização](#40-rls-autorização) · [41. Organization Context](#41-organization-context) · [42. RBAC](#42-rbac) · [43. Regra de Autorização](#43-regra-de-autorização)

**Parte IX — Banco de Dados e Infra**
[44. Banco de Dados](#44-banco-de-dados) · [45. Performance](#45-performance) · [46. Cache](#46-cache) · [47. Armazenamento de Imagens](#47-armazenamento-de-imagens) · [48. CDN](#48-cdn)

**Parte X — Loja Pública**
[49. Loja Pública](#49-loja-pública) · [50. Resolução da Loja](#50-resolução-da-loja) · [51. SEO](#51-seo) · [52. Responsividade](#52-responsividade) · [53. Dashboard Responsivo](#53-dashboard-responsivo)

**Parte XI — Arquitetura Técnica**
[54. Arquitetura de Frontend](#54-arquitetura-de-frontend) · [55. Arquitetura de Backend](#55-arquitetura-de-backend) · [56. API](#56-api) · [57. Contratos de API](#57-contratos-de-api) · [58. Validação](#58-validação) · [59. Erros](#59-erros) · [60. Frontend não deve possuir regra crítica](#60-frontend-não-deve-possuir-regra-crítica)

**Parte XII — Escalabilidade e Operação**
[61. Escalabilidade para Milhares de Usuários](#61-escalabilidade-para-milhares-de-usuários) · [62. Estado](#62-estado) · [63. Jobs Assíncronos](#63-jobs-assíncronos) · [64. Observabilidade](#64-observabilidade) · [65. Rate Limiting](#65-rate-limiting) · [66. Webhooks](#66-webhooks) · [67. Idempotência](#67-idempotência)

**Parte XIII — Billing Avançado**
[68. Planos e Billing](#68-planos-e-billing) · [69. Feature Entitlement](#69-feature-entitlement)

**Parte XIV — Testes e Segurança**
[70. Testes](#70-testes) · [71. Teste Mais Importante](#71-teste-mais-importante) · [72. Segurança contra IDOR](#72-segurança-contra-idor) · [73. Delete](#73-delete) · [74. Auditoria Técnica](#74-auditoria-técnica)

**Parte XV — UX e Design System**
[75. Design System](#75-design-system) · [76. Experiência do Usuário](#76-experiência-do-usuário) · [77. Empty States](#77-empty-states) · [78. Loading](#78-loading)

**Parte XVI — Execução pelo Claude Code**
[79. Responsabilidade do Claude Code](#79-responsabilidade-do-claude-code) · [80. Regra contra Destruição do Projeto](#80-regra-contra-destruição-do-projeto) · [81. Implementação Incremental](#81-implementação-incremental) · [82. Critério de Conclusão](#82-critério-de-conclusão) · [83. Regra de Desenvolvimento](#83-regra-de-desenvolvimento) · [84. Documentação](#84-documentação)

**Parte XVII — Regras de Extensibilidade**
[85. Regra para Novos Templates](#85-regra-para-novos-templates) · [86. Regra para Novos Planos](#86-regra-para-novos-planos) · [87. Regra para Novos Meios de Pagamento](#87-regra-para-novos-meios-de-pagamento) · [88. Regra para Novas Lojas](#88-regra-para-novas-lojas)

**Parte XVIII — Multi-Tenant em Profundidade**
[89. Regra de Isolamento Absoluto](#89-regra-de-isolamento-absoluto) · [90. Multi-Tenant + Cache](#90-multi-tenant-cache) · [91. Multi-Tenant + Storage](#91-multi-tenant-storage) · [92. Multi-Tenant + Analytics](#92-multi-tenant-analytics) · [93. Multi-Tenant + Admin](#93-multi-tenant-admin)

**Parte XIX — Deploy e Operações**
[94. Deploy](#94-deploy) · [95. CI/CD](#95-cicd) · [96. Migrations](#96-migrations) · [97. Backup](#97-backup)

**Parte XX — Performance Final**
[98. Performance do Dashboard](#98-performance-do-dashboard) · [99. Paginação](#99-paginação) · [100. Busca](#100-busca)

**Parte XXI — Visão Final**
[101. Arquitetura Final](#101-arquitetura-final) · [102. Objetivo Final](#102-objetivo-final) · [103. Princípio Mais Importante do Projeto](#103-princípio-mais-importante-do-projeto)

**Parte XXII — Instruções de Execução**
[104. Ordem de Execução do Claude Code](#104-ordem-de-execução-do-claude-code) · [105. Instrução Final para o Claude Code](#105-instrução-final-para-o-claude-code)

---

# 1. VISÃO DO PRODUTO

O SaaS Commerce será uma plataforma que permite que um usuário crie e administre sua própria loja digital de forma simples.

A plataforma deve funcionar como:

- catálogo digital;
- loja online;
- página social de produtos;
- link-in-bio comercial;
- vitrine personalizada;
- canal de vendas via WhatsApp;
- checkout;
- gerenciamento de produtos;
- gerenciamento de pedidos;
- gerenciamento de clientes;
- gerenciamento de múltiplas lojas.

A plataforma será **multi-tenant desde o núcleo da arquitetura**.

O sistema não deve ser construído como uma aplicação única onde todos os dados ficam misturados.

Cada usuário/organização deve possuir seu próprio contexto de dados, permissões e lojas.

---

# 2. PRINCÍPIOS FUNDAMENTAIS

O desenvolvimento deve obedecer obrigatoriamente aos seguintes princípios:

## 2.1 Multi-tenancy real

Todos os recursos pertencentes a clientes devem possuir associação inequívoca ao tenant/organização.

Nenhuma consulta de dados deve depender apenas do frontend para filtrar o tenant.

O isolamento deve existir também no backend/banco de dados.

---

## 2.2 Desacoplamento

Separar claramente:

- autenticação;
- usuários;
- organizações;
- planos;
- assinaturas;
- lojas;
- catálogo;
- produtos;
- pedidos;
- clientes;
- checkout;
- pagamentos;
- temas;
- arquivos;
- configurações;
- administração;
- analytics.

Evitar componentes gigantes e serviços monolíticos.

---

## 2.3 Theme Engine separado do Commerce Core

O mecanismo visual das lojas não pode controlar as regras comerciais do sistema.

O Commerce Core deve saber:

> produto, preço, estoque, pedido, cliente, loja etc.

O Theme Engine deve saber:

> como esses dados serão apresentados.

---

## 2.4 Configuração por dados

O visual da loja deve ser controlado por configuração.

Exemplo conceitual:

```json
{
  "theme": "aura-maison",
  "logo": "...",
  "colors": {},
  "menus": [],
  "sections": [],
  "banner": {},
  "social": {},
  "layout": {}
}
```

O objetivo é permitir novos templates sem reescrever o Commerce Core.

---

## 2.5 Escalabilidade

O sistema deve funcionar inicialmente com poucos clientes, mas sua arquitetura não pode depender de:

- dados globais em memória;
- estados globais frágeis;
- filtros feitos somente no frontend;
- arquivos locais do servidor;
- lógica específica para um único cliente;
- tabelas sem índices;
- consultas que carreguem milhares de registros desnecessariamente.

---

# 3. ESTRUTURA GERAL DO PRODUTO

O sistema possuirá três grandes áreas:

```text
SaaS Commerce
│
├── Site institucional
│
├── Autenticação
│
├── Área pública
│   └── Lojas
│
├── Painel do cliente
│   ├── Dashboard
│   ├── Lojas
│   ├── Produtos
│   ├── Pedidos
│   ├── Clientes
│   ├── Temas
│   ├── Configurações
│   └── Assinatura
│
└── Painel administrativo SaaS
    ├── Usuários
    ├── Organizações
    ├── Lojas
    ├── Planos
    ├── Assinaturas
    ├── Métricas
    ├── Sistema
    └── Auditoria
```

---

# 4. SITE INSTITUCIONAL

Criar página institucional profissional para apresentar o produto.

## 4.1 Home

A home deve conter:

### Hero

Mensagem clara sobre o produto.

Exemplo conceitual:

> Crie sua loja. Publique seus produtos. Venda pelas redes sociais.

CTA principal:

> Criar minha loja

CTA secundário:

> Conhecer a plataforma

---

## 4.2 Seção de benefícios

Apresentar:

- criação rápida de loja;
- catálogo profissional;
- integração com WhatsApp;
- checkout;
- Pix;
- múltiplas lojas;
- templates;
- gerenciamento centralizado;
- analytics.

---

## 4.3 Demonstração visual

Mostrar uma representação da loja e do painel.

Evitar aparência genérica de dashboard de ferramenta administrativa.

O produto deve parecer uma plataforma SaaS comercial profissional.

---

# 5. PÁGINA DE PLANOS

Criar página `/planos`.

Planos iniciais:

```text
BÁSICO
PRO
MASTER
```

Os limites devem ser configuráveis pelo sistema e não codificados diretamente em dezenas de componentes.

Exemplo de configuração:

```text
Plan
├── name
├── price
├── max_stores
├── max_products
├── max_users
├── available_themes
├── storage_limit
├── features
└── status
```

---

# 6. AUTENTICAÇÃO

Criar fluxo completo:

```text
Cadastro
↓
Confirmação
↓
Login
↓
Onboarding
↓
Criação da primeira loja
↓
Dashboard
```

Também implementar:

- login;
- logout;
- recuperação de senha;
- alteração de senha;
- sessão persistente;
- proteção de rotas;
- controle de sessão;
- tratamento de usuário desativado.

---

# 7. ONBOARDING

Após o primeiro login, o usuário deve passar por um onboarding simples.

Coletar:

- nome;
- nome da loja;
- slug da loja;
- categoria;
- WhatsApp;
- preferência de template.

Fluxo:

```text
Criar conta
↓
Criar organização
↓
Criar primeira loja
↓
Escolher template
↓
Cadastrar primeiro produto
↓
Publicar loja
```

O usuário não deve precisar entender a arquitetura interna do SaaS.

---

# 8. MODELO DE USUÁRIO E ORGANIZAÇÃO

Não assumir:

```text
1 usuário = 1 loja
```

O modelo deve permitir:

```text
Usuário
   ↓
Organização
   ↓
N lojas
```

Isso permite crescimento futuro.

Exemplo:

```text
User
 └── Organization
      ├── Store A
      ├── Store B
      └── Store C
```

---

# 9. PAINEL DO CLIENTE

Criar dashboard `/app`.

O cliente deve visualizar apenas os dados autorizados de sua organização.

Menu inicial:

```text
Dashboard
Lojas
Produtos
Pedidos
Clientes
Temas
Marketing
Analytics
Configurações
Assinatura
```

Recursos futuros podem ser adicionados sem alterar o núcleo.

---

# 10. DASHBOARD DO CLIENTE

O dashboard deve apresentar:

- vendas;
- pedidos;
- produtos;
- clientes;
- desempenho da loja;
- loja ativa;
- status da assinatura.

Cards iniciais:

```text
Vendas
Pedidos
Produtos
Clientes
```

Gráficos podem ser adicionados posteriormente.

Regra de performance do dashboard detalhada na seção 98 — vale desde já: nunca calcular totais varrendo todos os registros no frontend, usar agregação no banco.

---

# 11. GERENCIAMENTO DE LOJAS

Tela:

```text
/app/stores
```

Permitir:

- criar loja;
- editar loja;
- duplicar configuração;
- ativar/desativar;
- publicar;
- visualizar;
- configurar domínio futuramente;
- excluir.

Cada loja possui:

```text
id
organization_id
name
slug
status
theme_id
theme_config
created_at
updated_at
```

O `organization_id` é obrigatório.

---

# 12. SLUG DA LOJA

Cada loja terá um endereço público.

Exemplo:

```text
commerce.artefactho.com.br/loja/minha-loja
```

Ou futuramente:

```text
minhaloja.com.br
```

O sistema deve ser preparado para domínio customizado.

---

# 13. PRODUTOS

Cada loja pode possuir produtos.

Modelo conceitual:

```text
Product
├── id
├── store_id
├── organization_id
├── name
├── slug
├── description
├── price
├── compare_price
├── sku
├── stock
├── product_type       (physical | digital)
├── requires_shipping  (boolean, derivado de product_type)
├── status
├── images
├── category_id
├── metadata
├── created_at
└── updated_at
```

`product_type` define se o produto é físico (exige estoque e frete) ou digital/infoproduto (sem estoque físico, sem frete, geralmente com entrega automática de arquivo/acesso). Ver seção 16.3 para a regra completa de frete.

Nunca confiar somente no `store_id` enviado pelo frontend.

O backend deve validar:

```text
store pertence à organization atual
```

antes de qualquer operação.

---

# 14. CATEGORIAS

Criar:

- categorias;
- ordenação;
- ativação/desativação;
- slug;
- associação à loja.

Permitir:

```text
Loja A
 ├── Perfumes
 ├── Cosméticos
 └── Kits

Loja B
 ├── Roupas
 └── Calçados
```

Os dados nunca devem cruzar entre lojas.

---

# 15. CLIENTES

Cada loja poderá possuir seus próprios clientes.

Modelo:

```text
Customer
├── id
├── store_id
├── organization_id
├── name
├── email
├── phone
├── metadata
├── created_at
└── updated_at
```

---

# 16. PEDIDOS

Cada pedido pertence a uma loja e organização.

Modelo conceitual:

```text
Order
├── id
├── store_id
├── organization_id
├── customer_id
├── status
├── payment_status
├── subtotal
├── discount
├── shipping
├── total
├── payment_method
├── metadata
├── created_at
└── updated_at
```

Itens:

```text
OrderItem
├── id
├── order_id
├── product_id
├── product_name_snapshot
├── quantity
├── unit_price
└── total
```

Guardar snapshot de nome/preço no pedido para preservar histórico mesmo que o produto seja alterado posteriormente.

---

# 16.1 CARRINHO

Antes do checkout, o cliente final acumula itens em um carrinho.

Modelo conceitual:

```text
Cart
├── id
├── store_id
├── organization_id
├── customer_id (nullable — carrinho anônimo até identificação)
├── session_token (para carrinho anônimo/guest)
├── status (open | converted | abandoned)
├── created_at
└── updated_at

CartItem
├── id
├── cart_id
├── product_id
├── product_name_snapshot
├── unit_price_snapshot
├── quantity
└── metadata
```

O carrinho deve persistir por sessão/dispositivo (não depender só de estado local do frontend), permitindo retomar compra e, futuramente, recuperação de carrinho abandonado.

Ao finalizar o checkout, o `Cart` é convertido em `Order` — nunca editado retroativamente.

---

# 16.2 CUPONS E DESCONTOS

Cada loja pode configurar seus próprios cupons/promoções, isolados por `store_id`.

Modelo conceitual:

```text
Coupon
├── id
├── store_id
├── organization_id
├── code
├── type (percentage | fixed_amount)
├── value
├── min_order_value
├── max_uses
├── used_count
├── starts_at
├── expires_at
├── status
├── created_at
└── updated_at
```

Regras:

- Um cupom pertence a uma única loja; nunca deve ser aplicável entre lojas diferentes.
- Validar no backend: cupom existe, está ativo, dentro da validade, dentro do limite de usos, antes de aplicar desconto — nunca calcular desconto apenas no frontend.
- Registrar em `Order` qual cupom foi usado e o valor de desconto aplicado (snapshot), para preservar histórico mesmo se o cupom for alterado depois.

Isso também sustenta o menu **Marketing** já previsto no painel do cliente (seção 9).

---

# 16.3 FRETE (REGRA CONDICIONAL POR TIPO DE PRODUTO)

**Importante:** o SaaS Commerce em si (a Fábrica) não tem frete — ele cobra assinatura (seção 29/68). Frete é uma regra que existe **dentro da loja de cada lojista**, e apenas quando ele vende produtos físicos.

Regra:

```text
product.product_type === "physical"
  → requires_shipping = true
  → calcular/exibir frete no checkout

product.product_type === "digital"
  → requires_shipping = false
  → nunca exibir campo de frete
  → entrega pode ser automática (link/arquivo/acesso) após confirmação de pagamento
```

Se um pedido (`Order`) contiver **apenas** itens digitais, o campo `shipping` deve ser `0`/nulo e a etapa de frete deve ser omitida do checkout dessa loja.

Se um pedido misturar itens físicos e digitais, o frete é calculado apenas sobre os itens físicos.

O cálculo de frete em si (tabela fixa, por CEP, integração com transportadora) é responsabilidade de uma camada própria, para não acoplar a regra de frete ao Commerce Core:

```text
ShippingService
├── isRequired(order)
├── calculate(order, address)
└── getOptions(store, address)
```

Isso permite que lojas 100% digitais nunca vejam nada relacionado a frete, e lojas físicas tenham essa etapa normalmente.

---

# 16.4 CANCELAMENTO E REEMBOLSO

Todo pedido deve suportar um fluxo de pós-venda, não apenas criação e consulta.

Estados adicionais em `Order.status`:

```text
canceled
refund_requested
refunded
partially_refunded
```

Regras:

- Cancelamento e reembolso são operações críticas e devem passar por `AuditService` (seção 38) e `PaymentService` (seção 18), nunca alterar apenas o registro no banco sem refletir no gateway de pagamento.
- Reembolso deve ser idempotente (seção 67): reprocessar a mesma solicitação não pode reembolsar duas vezes.
- Regras de reembolso (prazo, parcial/total) podem variar por loja — não hardcodear uma única política no Commerce Core.

---

# 17. CHECKOUT

O checkout deve ser desacoplado da apresentação visual.

O Theme Engine pode chamar:

```text
Commerce Core
      ↓
Checkout Service
      ↓
Payment Provider
```

O tema não deve implementar regras de pagamento.

---

# 18. PIX

Preparar arquitetura para Pix.

O sistema deve possuir uma camada de abstração:

```text
PaymentService
```

com possibilidade futura de múltiplos provedores.

Exemplo:

```text
PaymentProvider
├── createPayment()
├── getPaymentStatus()
├── cancelPayment()
└── handleWebhook()
```

Não acoplar o Commerce Core a um único gateway.

---

# 19. WHATSAPP

Cada loja poderá configurar:

```text
WhatsApp
Mensagem padrão
```

O botão pode gerar uma mensagem com dados do produto/pedido.

Exemplo conceitual:

```text
Olá! Tenho interesse no produto X.
```

A integração deve ser isolada em um serviço próprio.

---

# 20. SISTEMA DE TEMPLATES

O SaaS deverá possuir um Theme Engine.

Estrutura conceitual:

```text
themes/
│
├── core/
│
├── aura-maison/
│   ├── theme.json
│   ├── components/
│   ├── sections/
│   ├── styles/
│   └── assets/
│
├── theme-02/
│
└── theme-03/
```

O Commerce Core não deve importar componentes específicos do Aura Maison.

---

# 21. THEME CONTRACT

Todo template deverá obedecer ao mesmo contrato.

Exemplo:

```text
Theme
├── id
├── name
├── version
├── supported_features
├── configuration_schema
└── renderer
```

O tema recebe dados normalizados:

```text
Store
Products
Categories
Cart
Customer
ThemeConfig
```

e transforma isso em interface.

---

# 22. CONFIGURAÇÃO DO TEMA

Exemplo:

```json
{
  "branding": {
    "logo": "",
    "store_name": ""
  },
  "colors": {
    "primary": "",
    "secondary": "",
    "background": ""
  },
  "navigation": {
    "menu": []
  },
  "hero": {
    "enabled": true,
    "title": "",
    "subtitle": "",
    "image": ""
  },
  "social": {
    "instagram": "",
    "facebook": "",
    "whatsapp": ""
  }
}
```

O sistema deve validar essa configuração.

Não permitir que um template quebre por configuração inválida.

---

# 23. AURA MAISON

O primeiro tema será o:

```text
Aura Maison
```

Direção visual:

- sofisticado;
- feminino;
- premium;
- limpo;
- elegante;
- responsivo.

Paleta base existente:

```text
#FAF8F5
#D4AF37
```

O tema deve ser implementado como um pacote independente.

---

# 24. MENUS

O sistema deverá permitir menus configuráveis.

Exemplo:

```text
Início
Produtos
Categorias
Contato
```

O tema decide como renderizar.

O Commerce Core fornece os dados.

---

# 25. BANNER

Configuração:

```text
banner.enabled
banner.title
banner.subtitle
banner.image
banner.button
banner.link
```

O cliente altera a configuração pelo painel.

---

# 26. CUSTOMIZADOR

Preparar arquitetura para futuro editor visual.

O cliente poderá alterar:

- logo;
- nome da loja;
- cores;
- banner;
- menus;
- categorias;
- textos;
- imagens;
- ordem das seções.

O customizador deve alterar apenas configuração.

Não deve modificar código do tema.

---

# 27. TEMPLATES POR PLANO

O sistema deverá controlar quais temas cada plano pode utilizar.

Exemplo:

```text
BÁSICO
├── Template padrão

PRO
├── Template padrão
├── Aura Maison
└── Template Premium

MASTER
├── Todos os templates
└── Recursos avançados
```

Essa regra deve vir da configuração do plano.

Não criar:

```javascript
if (plan === "PRO") ...
```

espalhados pela aplicação.

Preferir:

```text
Plan
↓
Features
↓
Theme Access
```

---

# 28. FEATURE FLAGS

Recursos devem poder ser controlados por feature flags.

Exemplo:

```text
multiple_stores
custom_domain
advanced_analytics
premium_themes
whatsapp
pix
customizer
```

Isso permitirá evolução dos planos sem reescrever o sistema.

---

# 29. ASSINATURAS

Criar estrutura preparada para:

```text
Organization
↓
Subscription
↓
Plan
```

A assinatura deve controlar o plano atual da organização.

Estados:

```text
trial
active
past_due
canceled
expired
suspended
```

---

# 30. CONTROLE DE LIMITES

Criar um serviço central:

```text
PlanLimitService
```

Ele será responsável por verificar:

```text
quantidade de lojas
quantidade de produtos
armazenamento
usuários
recursos premium
```

Exemplo conceitual:

```text
canCreateStore(organization)
canCreateProduct(organization)
canUseTheme(organization, theme)
canUseFeature(organization, feature)
```

Não duplicar essas regras em vários componentes.

---

# 31. PAINEL ADMINISTRATIVO DO SAAS

Criar uma área exclusiva:

```text
/admin
```

Essa área não é o dashboard do cliente.

É o painel de controle da plataforma.

---

# 32. SEGURANÇA DO ADMIN

Somente usuários com função administrativa poderão acessar.

Exemplo de roles:

```text
master_admin
support_admin
billing_admin
```

O primeiro administrador deve possuir privilégios completos.

---

# 33. PAINEL DE USUÁRIOS

O administrador deverá conseguir:

- pesquisar usuários;
- visualizar usuário;
- visualizar organização;
- visualizar lojas;
- visualizar plano;
- visualizar assinatura;
- ativar/desativar usuário;
- bloquear acesso;
- consultar histórico.

Nunca permitir que uma alteração administrativa viole o isolamento de tenant.

---

# 34. PAINEL DE ORGANIZAÇÕES

Mostrar:

```text
Organização
Plano
Status
Quantidade de lojas
Quantidade de usuários
Quantidade de produtos
Data de criação
Último acesso
```

Ações:

```text
Visualizar
Suspender
Reativar
Alterar plano
```

---

# 35. PAINEL DE LOJAS

O administrador deve conseguir localizar uma loja por:

- nome;
- slug;
- organização;
- usuário;
- status.

Visualizar:

- informações;
- tema;
- quantidade de produtos;
- pedidos;
- status.

---

# 36. PAINEL DE PLANOS

Planos não devem ser hardcoded.

O administrador deve poder futuramente configurar:

```text
nome
preço
limites
features
temas permitidos
status
```

---

# 37. DASHBOARD ADMINISTRATIVO

Mostrar métricas globais:

```text
Usuários
Organizações
Lojas
Produtos
Pedidos
GMV
Assinaturas ativas
Novos clientes
```

As métricas devem ser agregadas eficientemente.

Nunca carregar todos os pedidos para calcular:

```text
COUNT()
SUM()
```

no frontend.

---

# 38. AUDITORIA

Criar mecanismo de auditoria para ações críticas.

Exemplo:

```text
AuditLog
├── id
├── organization_id
├── actor_user_id
├── action
├── resource_type
├── resource_id
├── metadata
├── ip
└── created_at
```

Registrar principalmente:

- login administrativo;
- alteração de plano;
- suspensão;
- alteração de usuário;
- exclusão de dados;
- alterações críticas.

---

# 38.1 LGPD E PRIVACIDADE

O sistema trata dados pessoais de lojistas e de clientes finais (nome, e-mail, telefone, endereço). Isso exige conformidade com a LGPD desde o desenho do banco, não como camada adicionada depois.

Obrigatório:

- **Base legal e finalidade clara** para cada dado coletado (ex: telefone do cliente final é coletado para contato via WhatsApp/entrega).
- **Direito de exclusão**: o titular (lojista ou cliente final) deve poder solicitar a exclusão de seus dados. Implementar via soft delete (`deleted_at`, seção 73) com posterior expurgo definitivo conforme prazo de retenção definido.
- **Direito de acesso/portabilidade**: o lojista deve poder exportar os dados de sua organização (clientes, pedidos) a qualquer momento.
- **Minimização**: não coletar ou armazenar dado que a plataforma não utiliza.
- **Página de Política de Privacidade e Termos de Uso** no site institucional (seção 4), com aceite obrigatório no cadastro.
- **Consentimento explícito** do cliente final na loja pública ao informar seus dados (ex: checkbox no checkout).
- Dados sensíveis (se algum dia existirem, ex: documentos) devem ter camada extra de proteção e nunca ser expostos em logs, exports ou analytics.

Isso se soma — e não substitui — as regras de isolamento entre tenants já definidas nas seções seguintes: aqui trata-se do titular do dado ter controle sobre o próprio dado, mesmo dentro do seu tenant.

---

# 39. ISOLAMENTO MULTI-TENANT

REGRA FUNDAMENTAL:

> Um tenant jamais poderá consultar ou alterar dados pertencentes a outro tenant.

Todas as entidades comerciais deverão possuir referência de tenant.

Estrutura conceitual:

```text
Organization
   │
   ├── Users
   ├── Stores
   │    ├── Products
   │    ├── Categories
   │    ├── Orders
   │    └── Customers
   │
   └── Subscription
```

---

# 40. RLS / AUTORIZAÇÃO

Quando a tecnologia escolhida suportar Row Level Security, utilizar RLS como camada adicional de segurança.

A aplicação não deve depender exclusivamente do frontend para isolamento.

Fluxo:

```text
User
 ↓
Session
 ↓
Organization Context
 ↓
Authorization
 ↓
Database Policy
 ↓
Data
```

---

# 41. ORGANIZATION CONTEXT

Criar um serviço central:

```text
OrganizationContext
```

Responsável por determinar:

```text
usuário atual
organização atual
loja atual
role
plano
permissões
```

Não espalhar lógica de tenant pela aplicação.

---

# 42. RBAC

Implementar controle de acesso baseado em funções.

Estrutura:

```text
Organization
├── owner
├── admin
├── manager
└── staff
```

Permissões futuras:

```text
products.read
products.write
orders.read
orders.write
customers.read
stores.write
settings.write
```

---

# 43. REGRA DE AUTORIZAÇÃO

Nunca fazer:

```text
frontend:
"esse produto pertence ao usuário"
```

e confiar nisso.

Sempre validar no servidor:

```text
current_user
↓
organization
↓
store
↓
resource
```

---

# 44. BANCO DE DADOS

O banco deve ser projetado com:

- foreign keys;
- índices;
- constraints;
- timestamps;
- UUID/IDs seguros;
- índices compostos;
- paginação.

Índices importantes deverão considerar consultas por:

```text
organization_id
store_id
status
created_at
slug
```

---

# 45. PERFORMANCE

Nunca carregar:

```text
SELECT * FROM products
```

sem necessidade.

Preferir:

```text
paginação
limites
select específico
filtros
ordenação indexada
```

Listagens devem utilizar paginação.

---

# 46. CACHE

Cache poderá ser utilizado para:

- configurações públicas da loja;
- catálogo público;
- temas;
- dados que mudam pouco.

Não usar cache de forma que provoque vazamento entre tenants.

Toda chave de cache deverá considerar o contexto correto.

Exemplo:

```text
store:{store_id}:catalog
```

e não simplesmente:

```text
catalog
```

---

# 47. ARMAZENAMENTO DE IMAGENS

Não depender do disco local da aplicação para imagens de usuários.

Utilizar storage apropriado.

Estrutura:

```text
organization/
    store/
        products/
        branding/
        banners/
```

A política de acesso deve impedir acesso indevido aos arquivos.

---

# 48. CDN

Preparar assets públicos para distribuição via CDN.

Especialmente:

- imagens;
- logos;
- banners;
- imagens de produtos;
- arquivos estáticos.

---

# 49. LOJA PÚBLICA

A loja pública deve ser acessível sem login.

Fluxo:

```text
URL
 ↓
Resolver loja
 ↓
Carregar configuração
 ↓
Carregar tema
 ↓
Carregar catálogo
 ↓
Renderizar
```

Não carregar dashboard ou dados privados.

---

# 50. RESOLUÇÃO DA LOJA

Criar um mecanismo:

```text
StoreResolver
```

que receba:

```text
slug
```

ou futuramente:

```text
custom_domain
```

e retorne a loja pública correspondente.

O resolver deve verificar:

```text
loja existe
loja está ativa
loja está publicada
```

---

# 51. SEO

Preparar páginas públicas para SEO:

- title;
- description;
- Open Graph;
- imagem social;
- URLs amigáveis;
- sitemap futuramente;
- dados estruturados futuramente.

---

# 52. RESPONSIVIDADE

A loja pública deve funcionar perfeitamente em:

- celular;
- tablet;
- desktop.

Prioridade:

```text
Mobile First
```

---

# 53. DASHBOARD RESPONSIVO

O painel também deve funcionar em telas menores.

Mas a prioridade de experiência pode ser:

```text
Desktop
Tablet
Mobile
```

sem sacrificar usabilidade.

---

# 54. ARQUITETURA DE FRONTEND

Organizar por domínio funcional, não apenas por tipo de arquivo.

Preferir:

```text
src/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── stores/
│   ├── products/
│   ├── orders/
│   ├── customers/
│   ├── billing/
│   ├── themes/
│   └── admin/
│
├── core/
│   ├── auth/
│   ├── permissions/
│   ├── api/
│   └── tenant/
│
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

Adaptar essa organização de pastas ao framework escolhido na fase de arquitetura (seção 79).

**Depois que a stack for escolhida e aprovada, não trocá-la sem necessidade real.**

---

# 55. ARQUITETURA DE BACKEND

Separar responsabilidades.

Exemplo:

```text
AuthService
OrganizationService
StoreService
ProductService
OrderService
CustomerService
CheckoutService
PaymentService
ThemeService
SubscriptionService
PlanLimitService
AuditService
```

Um serviço não deve assumir responsabilidade de todos os outros.

---

# 56. API

A API deve possuir endpoints organizados por domínio.

Exemplo:

```text
/auth
/organizations
/stores
/products
/categories
/orders
/customers
/checkout
/payments
/themes
/subscriptions
/admin
```

Todas as rotas privadas devem validar autenticação e autorização.

---

# 57. CONTRATOS DE API

Definir contratos claros.

Exemplo:

```text
GET /stores
POST /stores
GET /stores/:id
PATCH /stores/:id
DELETE /stores/:id
```

Os contratos devem permanecer independentes do tema visual.

---

# 58. VALIDAÇÃO

Toda entrada externa deve ser validada.

Validar:

- body;
- query;
- params;
- uploads;
- IDs;
- valores monetários;
- limites;
- permissões.

Não confiar em dados enviados pelo navegador.

---

# 59. ERROS

Criar tratamento padronizado.

Exemplo:

```json
{
  "error": {
    "code": "STORE_NOT_FOUND",
    "message": "Loja não encontrada."
  }
}
```

Evitar mensagens internas ou stack traces em produção.

---

# 60. FRONTEND NÃO DEVE POSSUIR REGRA CRÍTICA

Mesma regra fundamental da seção 43 (REGRA DE AUTORIZAÇÃO), reforçada aqui para o contexto de frontend: um `if` de React/Vue/etc. controla apenas experiência (mostrar/esconder botão, navegação), nunca segurança.

A validação real de permissão e propriedade do recurso deve estar sempre no backend/database (ver fluxo completo na seção 43).

---

# 61. ESCALABILIDADE PARA MILHARES DE USUÁRIOS

A arquitetura deve permitir crescimento horizontal.

Exemplo:

```text
                 CDN
                  │
             Load Balancer
                  │
       ┌──────────┼──────────┐
       │          │          │
    App 01     App 02     App 03
       │          │          │
       └──────────┼──────────┘
                  │
              Database
                  │
               Storage
```

A aplicação não deve depender de estado armazenado somente na memória de uma instância.

---

# 62. ESTADO

Sessões e informações compartilhadas não devem depender de:

```text
global variables
local process memory
```

Utilizar mecanismo apropriado de sessão/cache quando necessário.

---

# 63. JOBS ASSÍNCRONOS

Operações pesadas devem poder ser executadas em background.

Exemplos futuros:

- processamento de imagens;
- geração de relatórios;
- emails;
- notificações;
- analytics;
- importação de produtos;
- processamento de pagamentos.

Preparar arquitetura para filas.

---

# 64. OBSERVABILIDADE

Preparar:

- logs estruturados;
- monitoramento;
- métricas;
- erros;
- health check.

Criar endpoint:

```text
/health
```

para verificar disponibilidade.

---

# 65. RATE LIMITING

Rotas sensíveis devem possuir proteção contra abuso.

Principalmente:

```text
login
signup
password reset
checkout
webhooks
API pública
```

---

# 66. WEBHOOKS

Webhooks de pagamento devem ser:

- autenticados/verificados;
- idempotentes;
- registrados;
- processados com segurança.

Nunca assumir que um webhook chegará apenas uma vez.

Criar mecanismo para impedir processamento duplicado.

---

# 67. IDEMPOTÊNCIA

Operações críticas devem poder ser repetidas sem gerar duplicidade.

Principalmente:

```text
pedido
pagamento
webhook
assinatura
```

---

# 68. PLANOS E BILLING

Não espalhar valores dos planos pelo frontend.

O plano deve ser uma entidade/configuração central.

Exemplo:

```text
Plan
Subscription
Feature
PlanFeature
```

Isso permite mudar preços e recursos sem alterar código da loja.

---

# 69. FEATURE ENTITLEMENT

Criar conceito:

```text
Entitlement
```

Exemplo:

```text
organization.hasFeature("premium_themes")
```

e:

```text
organization.canCreateStore()
```

Isso centraliza a lógica comercial.

---

# 70. TESTES

Criar testes para os fluxos críticos.

Obrigatórios:

### Auth

- cadastro;
- login;
- logout;
- recuperação.

### Tenant

- usuário A não acessa dados de B;
- organização A não acessa loja de B;
- produto A não aparece para B.

### Stores

- criação;
- edição;
- exclusão;
- publicação.

### Products

- CRUD;
- limites do plano;
- isolamento.

### Orders

- criação;
- consulta;
- atualização;
- isolamento.

### Plans

- acesso por plano;
- limites;
- features.

---

# 71. TESTE MAIS IMPORTANTE

Criar explicitamente testes de isolamento.

Exemplo:

```text
Tenant A
 └── Product A

Tenant B
 └── Product B
```

Testar:

```text
Tenant A tentando acessar Product B
```

Resultado obrigatório:

```text
DENIED
```

Nunca:

```text
200 OK
```

---

# 72. SEGURANÇA CONTRA IDOR

Não confiar em:

```text
/product/123
```

apenas porque o usuário está autenticado.

Verificar:

```text
product.organization_id === currentOrganization.id
```

ou equivalente através da camada de autorização/RLS.

---

# 73. DELETE

Excluir dados críticos deve ser tratado cuidadosamente.

Quando necessário utilizar:

```text
soft delete
```

para preservar integridade/histórico.

Exemplo:

```text
deleted_at
```

---

# 74. AUDITORIA TÉCNICA

Toda operação crítica deve ser rastreável.

Registrar:

```text
quem
quando
o quê
qual recurso
qual tenant
```

---

# 75. DESIGN SYSTEM

Criar componentes reutilizáveis para:

- botões;
- inputs;
- cards;
- tabelas;
- modais;
- dropdowns;
- alerts;
- badges;
- navegação;
- loading;
- empty states.

Evitar componentes duplicados.

---

# 76. EXPERIÊNCIA DO USUÁRIO

A plataforma deve transmitir:

```text
simples
profissional
rápida
confiável
premium
```

Evitar:

- telas excessivamente técnicas;
- excesso de configurações;
- dashboards poluídos;
- aparência de sistema administrativo antigo.

---

# 77. EMPTY STATES

Quando não houver dados:

```text
Você ainda não possui produtos.
```

Com CTA:

```text
Adicionar produto
```

Não deixar telas vazias ou quebradas.

---

# 78. LOADING

Todas as operações assíncronas importantes devem possuir:

- loading;
- feedback de sucesso;
- feedback de erro.

Evitar telas congeladas.

---

# 79. RESPONSABILIDADE DO CLAUDE CODE

Não existe projeto anterior a preservar. O Claude Code deverá, antes de escrever qualquer código:

1. analisar os requisitos deste documento (SPEC_MASTER);
2. propor e justificar a arquitetura técnica (frontend, backend, database, auth, storage, cache, queue, deploy);
3. comparar as opções relevantes de stack, explicando trade-offs (ex: Next.js vs outro framework; Postgres com RLS própria vs Supabase; storage S3-compatible vs outro);
4. definir o modelo de multi-tenancy e isolamento de dados na prática (schema, RLS/policies ou equivalente);
5. definir a estratégia de autenticação e RBAC;
6. apresentar o plano de arquitetura para aprovação **antes** de criar o projeto.

Somente após a arquitetura ser aprovada, o Claude Code cria o projeto do zero e começa a implementação pela ordem de execução (seção 104).

**Não escolher tecnologia por familiaridade — escolher pelo que a seção de critérios técnicos acima exige.**

---

# 80. REGRA CONTRA DESTRUIÇÃO DO PROJETO

Antes de grandes alterações:

```text
git status
git diff
```

Criar commit antes de alterações estruturais importantes.

Nunca executar comandos destrutivos sem confirmação explícita.

Nunca remover banco, migrations ou arquivos importantes sem verificar dependências.

---

# 81. IMPLEMENTAÇÃO INCREMENTAL

A implementação deve acontecer em fases.

## FASE 1 — FUNDAÇÃO

Implementar/verificar:

- estrutura;
- autenticação;
- organização;
- tenant context;
- RBAC;
- banco;
- RLS;
- layout base.

---

## FASE 2 — SITE

Implementar:

- home;
- planos;
- login;
- cadastro;
- recuperação;
- onboarding.

---

## FASE 3 — CORE COMMERCE

Implementar:

- lojas;
- categorias;
- produtos;
- clientes;
- pedidos.

---

## FASE 4 — THEME ENGINE

Implementar:

- Theme Contract;
- Theme Registry;
- Aura Maison;
- configuração;
- renderização.

---

## FASE 5 — CHECKOUT

Implementar:

- carrinho;
- checkout;
- Pix;
- WhatsApp;
- pedidos.

---

## FASE 6 — BILLING

Implementar:

- planos;
- assinatura;
- limites;
- features;
- entitlements.

---

## FASE 7 — ADMIN

Implementar:

- usuários;
- organizações;
- lojas;
- planos;
- métricas;
- auditoria.

---

## FASE 8 — ESCALA

Revisar:

- índices;
- queries;
- cache;
- storage;
- filas;
- rate limit;
- logs;
- monitoramento.

---

# 82. CRITÉRIO DE CONCLUSÃO

Uma fase só deve ser considerada concluída quando:

```text
Código implementado
+
Build funcionando
+
Testes passando
+
Sem erros críticos
+
Isolamento validado
+
Responsividade validada
+
Fluxo principal funcionando
```

---

# 83. REGRA DE DESENVOLVIMENTO

O Claude Code deve trabalhar de maneira incremental.

Antes de executar uma grande alteração:

```text
ANALISAR
↓
PLANEJAR
↓
IMPLEMENTAR
↓
TESTAR
↓
CORRIGIR
↓
BUILD
↓
COMMIT
```

Não modificar dezenas de módulos sem validar o resultado intermediário.

---

# 84. DOCUMENTAÇÃO

Manter no projeto:

```text
README.md
ARCHITECTURE.md
THEME_CONTRACT.md
DATABASE.md
SECURITY.md
DEPLOYMENT.md
```

Além destes, o projeto mantém uma camada de documentação operacional para o
próprio Claude Code, que não descreve o produto e sim como trabalhar nele:

```text
CLAUDE.md               → memória operacional lida a cada sessão
PROGRESS.md             → estado atual do projeto, fase e histórico
CRITERIOS_DE_ACEITE.md  → checklist testável por fase
SEED_DATA.md            → cenário padrão de dados para testes de isolamento
/adr/                    → registro de decisões de arquitetura (ADRs)
```

`PROGRESS.md` deve ser atualizado ao final de cada sessão. `/adr/` deve
receber um novo registro antes de qualquer decisão estrutural (stack, banco,
auth, storage, pagamentos, deploy) ser implementada — nunca depois.

Este documento:

```text
SPEC_MASTER.md
```

será a referência principal do produto.

---

# 85. REGRA PARA NOVOS TEMPLATES

Adicionar um template novo não pode exigir alteração do Commerce Core.

Fluxo:

```text
Criar Theme
↓
Implementar Theme Contract
↓
Registrar Theme
↓
Definir configuração
↓
Associar aos planos
```

O Core permanece intacto.

---

# 86. REGRA PARA NOVOS PLANOS

Adicionar novo plano não pode exigir alteração estrutural da aplicação.

Exemplo:

```text
Enterprise
```

deve poder ser adicionado através de configuração.

---

# 87. REGRA PARA NOVOS MEIOS DE PAGAMENTO

Adicionar novo gateway deve exigir implementação de um novo adapter/provider.

Não reescrever:

```text
Orders
Checkout
Theme
Dashboard
```

---

# 88. REGRA PARA NOVAS LOJAS

Criar 1 ou 10.000 lojas não deve alterar a arquitetura.

A loja deve ser apenas uma entidade:

```text
Store
```

dentro de uma:

```text
Organization
```

---

# 89. REGRA DE ISOLAMENTO ABSOLUTO

Este é um requisito de segurança de nível máximo.

Nunca permitir:

```text
Tenant A
       ↓
Tenant B
```

por:

- URL;
- ID;
- slug;
- API;
- busca;
- filtro;
- exportação;
- dashboard;
- storage;
- cache;
- webhook;
- analytics.

Toda operação privada deve validar contexto.

---

# 90. MULTI-TENANT + CACHE

Qualquer cache deve incluir contexto.

Exemplo correto:

```text
tenant:{organization_id}:store:{store_id}:products
```

Evitar chaves globais que possam devolver dados de outro tenant.

---

# 91. MULTI-TENANT + STORAGE

Arquivos devem seguir namespace lógico:

```text
/{organization_id}/{store_id}/...
```

As políticas de acesso devem verificar pertencimento.

---

# 92. MULTI-TENANT + ANALYTICS

Métricas privadas devem ser filtradas por:

```text
organization_id
```

Métricas administrativas globais só podem ser acessadas por administradores.

---

# 93. MULTI-TENANT + ADMIN

O administrador SaaS pode possuir visão global.

Mas essa permissão deve ser explicitamente diferente da permissão de cliente.

Não conceder acesso global simplesmente porque o usuário está autenticado.

---

# 94. DEPLOY

O projeto deve ser preparado para ambientes:

```text
development
staging
production
```

Variáveis sensíveis devem ficar em:

```text
environment variables
```

Nunca colocar:

- secrets;
- tokens;
- senhas;
- chaves privadas;

diretamente no código.

---

# 95. CI/CD

Preparar pipeline para:

```text
lint
↓
typecheck
↓
tests
↓
build
↓
deploy
```

Uma alteração que quebra o build não deve chegar à produção.

---

# 96. MIGRATIONS

Toda alteração estrutural do banco deve possuir migration.

Não modificar banco de produção manualmente sem rastreabilidade.

---

# 97. BACKUP

Preparar rotina de backup do banco.

Também definir estratégia de recuperação.

---

# 98. PERFORMANCE DO DASHBOARD

O dashboard não deve consultar todo o banco.

Exemplo ruim:

```text
buscar todos os pedidos
↓
JavaScript calcula total
```

Preferir:

```text
database aggregation
↓
API
↓
dashboard
```

---

# 99. PAGINAÇÃO

Listagens grandes devem utilizar paginação.

Exemplo:

```text
20
50
100
```

registros por página.

Não carregar milhares de registros de uma vez.

---

# 100. BUSCA

Preparar busca por:

```text
produto
cliente
pedido
loja
usuário
```

Usar índices e mecanismos adequados conforme o crescimento.

---

# 101. ARQUITETURA FINAL

A visão geral deve ser:

```text
                 ┌─────────────────────┐
                 │   SITE INSTITUCIONAL│
                 └──────────┬──────────┘
                            │
                    ┌───────▼───────┐
                    │      AUTH     │
                    └───────┬───────┘
                            │
                ┌───────────▼───────────┐
                │    ORGANIZATION       │
                │       CONTEXT         │
                └───────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
       ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
       │   STORES  │  │ COMMERCE  │  │  BILLING  │
       └─────┬─────┘  └─────┬─────┘  └───────────┘
             │              │
             │        ┌─────▼─────┐
             │        │ CHECKOUT  │
             │        └─────┬─────┘
             │              │
       ┌─────▼──────────────▼─────┐
       │       THEME ENGINE       │
       └─────────────┬────────────┘
                     │
              ┌──────▼──────┐
              │ AURA MAISON │
              └─────────────┘
```

---

# 102. OBJETIVO FINAL

O resultado deve ser uma plataforma onde:

```text
Usuário
 ↓
Cria conta
 ↓
Escolhe plano
 ↓
Cria organização
 ↓
Cria loja
 ↓
Escolhe template
 ↓
Personaliza
 ↓
Cadastra produtos
 ↓
Publica
 ↓
Recebe pedidos
 ↓
Gerencia tudo pelo dashboard
```

Enquanto o administrador:

```text
Admin SaaS
 ↓
Controla usuários
 ↓
Controla organizações
 ↓
Controla lojas
 ↓
Controla planos
 ↓
Controla assinaturas
 ↓
Monitora plataforma
 ↓
Audita operações
```

---

# 103. PRINCÍPIO MAIS IMPORTANTE DO PROJETO

O SaaS Commerce deve ser construído como **uma plataforma**, e não como uma única loja transformada em SaaS.

A arquitetura deve permitir:

```text
1 usuário
10 usuários
100 usuários
1.000 usuários
10.000 usuários
```

sem necessidade de reescrever o núcleo.

Da mesma forma:

```text
1 loja
100 lojas
1.000 lojas
10.000 lojas
```

devem continuar obedecendo ao mesmo modelo de isolamento.

---

# 104. ORDEM DE EXECUÇÃO DO CLAUDE CODE

O Claude Code deve começar pela análise dos requisitos deste documento — não existe projeto anterior para analisar.

Fluxo obrigatório antes de qualquer código:

```text
ANALISAR REQUISITOS
       ↓
DEFINIR ARQUITETURA
       ↓
ESCOLHER STACK (com justificativa)
       ↓
DEFINIR BANCO
       ↓
DEFINIR MULTI-TENANCY
       ↓
DEFINIR AUTH / RBAC
       ↓
DEFINIR CORE
       ↓
DEFINIR THEME ENGINE
       ↓
CRIAR PROJETO DO ZERO
```

Esse plano de arquitetura deve ser apresentado e aprovado antes da criação do projeto.

**Não iniciar a implementação escolhendo tecnologia por familiaridade, e não pular a etapa de justificativa da stack.**

Após a arquitetura aprovada e o projeto criado, implementar nesta ordem:

```text
1. Fundação / Tenant / Auth
2. Banco / Segurança / isolamento multi-tenant (RLS ou equivalente da stack escolhida)
3. Site institucional
4. Login / Cadastro / Onboarding
5. Dashboard cliente
6. Stores
7. Products
8. Categories
9. Customers
10. Carrinho
11. Orders
12. Cupons/Descontos
13. Theme Engine
14. Aura Maison
15. Checkout
16. Frete (condicional por product_type)
17. WhatsApp
18. Pix
19. Cancelamento/Reembolso
20. Plans
21. Billing
22. Admin Dashboard
23. Usuários
24. Organizações
25. Auditoria
26. LGPD (exclusão de dados, exportação, políticas)
27. Performance
28. Testes de isolamento
29. Build
30. Deploy
```

---

# 105. INSTRUÇÃO FINAL PARA O CLAUDE CODE

**Leia este arquivo inteiro antes de implementar qualquer funcionalidade.**

Este projeto começa do zero. Não existe projeto legado, código do Lovable ou qualquer base pré-existente a ser preservada, então este documento não deve ser tratado como um "conserto" de algo que já existe — é a especificação do produto a ser construído.

Primeiro:

```text
ANALISAR OS REQUISITOS DESTE DOCUMENTO.
DEFINIR E JUSTIFICAR A ARQUITETURA (seção 79).
APRESENTAR O PLANO PARA APROVAÇÃO ANTES DE CRIAR O PROJETO.
```

Só depois disso, criar o projeto e seguir a ordem de execução (seção 104), fase por fase.

Ao final de cada fase, use a mesma classificação para validar o que foi entregue contra esta spec, evitando ilusão de progresso:

```text
[OK]        implementado conforme a spec
[PARTIAL]   implementado parcialmente
[MISSING]   ainda não implementado
[PROBLEM]   implementado de forma incorreta / foge da spec
```

Apresente esse diagnóstico ao final de cada fase, antes de avançar para a próxima.

Depois execute as correções **por fases**, validando cada fase antes de avançar.

Prioridades absolutas:

```text
1. Segurança
2. Isolamento multi-tenant
3. Desacoplamento
4. Integridade dos dados
5. Funcionalidade
6. Performance
7. UX/UI
```

Nunca sacrificar segurança ou isolamento para acelerar desenvolvimento.

Nunca criar uma solução que funcione apenas para o usuário de teste.

O sistema deve ser construído para ser uma plataforma SaaS real, multi-tenant, escalável e preparada para evolução.

**FIM DA SPEC_MASTER**