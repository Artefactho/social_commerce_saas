from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Loja

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    """
    Endpoint de Registro Livre (Onboarding)
    Cria o usuário base para o SaaS. A criação da Loja será após o login.
    """
    data = request.data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not password:
        return Response({'detail': 'Preencha usuário e senha.'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Este nome de usuário já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'detail': e.messages}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User.objects.create(
        username=username,
        email=email,
        password=make_password(password) # Hash obrigatório
    )
    
    return Response({'detail': 'Usuário criado com sucesso!', 'user_id': user.id}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me(request):
    """
    SaaS-Ready: Retorna detalhes da sessão do usuário atual
    e informações das suas Lojas (Tenants).
    """
    user = request.user
    lojas = Loja.objects.filter(owner=user)
    
    lojas_data = []
    for loja in lojas:
        lojas_data.append({
            'id': loja.id,
            'slug': loja.slug,
            'nome': loja.nome,
            'plano': loja.plano,
        })

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        },
        'lojas_gerenciadas': lojas_data
    })
