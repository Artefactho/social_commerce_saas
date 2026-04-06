from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from produtos import views, views_checkout, views_dashboard, api_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Dashboard / Admin
    path('dashboard/entrar/', views_dashboard.preparar_dashboard_v2, name='preparar_dashboard'),
    path('dashboard/<slug:loja_slug>/', views_dashboard.dashboard_loja, name='dashboard_loja'),
    path('dashboard/<slug:loja_slug>/produtos/', views_dashboard.meus_produtos, name='meus_produtos'),
    path('dashboard/<slug:loja_slug>/produtos/novo/', views_dashboard.adicionar_produto, name='adicionar_produto'),
    path('dashboard/<slug:loja_slug>/produtos/editar/<int:produto_id>/', views_dashboard.editar_produto, name='editar_produto'),
    path('dashboard/<slug:loja_slug>/produtos/deletar/<int:produto_id>/', views_dashboard.deletar_produto, name='deletar_produto'),
    path('dashboard/<slug:loja_slug>/config/', views_dashboard.configurar_loja, name='configurar_loja'),
    path('dashboard/<slug:loja_slug>/pedido/<int:pedido_id>/', views_dashboard.pedido_detalhe, name='pedido_detalhe'),
    path('dashboard/<slug:loja_slug>/pedido/<int:pedido_id>/status/', views_dashboard.atualizar_status_pedido, name='atualizar_status_pedido'),
    
    # Auth SaaS
    path('pj/cadastro/', views_dashboard.signup_merchant, name='signup_merchant'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('admin/password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home_saas'),
    # NOVAS ROTAS DE TEMA E ADMIN SaaS
    path('dashboard/<slug:loja_slug>/tema/', views_dashboard.editar_template, name='editar_template'),
    path('dashboard/<slug:loja_slug>/agentes/', views_dashboard.agentes_ia, name='agentes_ia'),
    path('api/agente-ia/simular/', views_dashboard.simular_agente, name='simular_agente'),
    path('saas-master-admin/', views_dashboard.saas_admin, name='saas_admin'),

    # NOVAS ROTAS DE CHECKOUT E WEBHOOK SaaS
    path('<slug:loja_slug>/checkout/finalizar/', views_checkout.finalizar_carrinho, name='finalizar_carrinho'),
    path('api/webhook/pagamento/<slug:loja_slug>/', views_checkout.webhook_pagamento, name='webhook_pagamento'),

    # ======= API & JWT AUTH =======
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', api_views.auth_register, name='api_auth_register'),
    path('api/users/me/', api_views.auth_me, name='api_auth_me'),
    # ==============================


    path('<slug:loja_slug>/', views.vitrine_view, name='vitrine_loja'),
    path('<slug:loja_slug>/carrinho/', views.ver_carrinho, name='ver_carrinho'),
    path('<slug:loja_slug>/add/<int:produto_id>/', views.add_carrinho, name='add_carrinho'),
    path('<slug:loja_slug>/remove/<int:produto_id>/', views.remove_carrinho, name='remove_carrinho'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
