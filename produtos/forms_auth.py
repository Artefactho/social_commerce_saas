from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Loja, Account, AccountUser, Plan, Subscription, can_add_loja
import re

SLUGS_RESERVADOS = {'admin', 'api', 'dashboard', 'accounts', 'static', 'media', 'pj', 'saas-master-admin', 'login', 'logout'}

class MerchantSignUpForm(forms.ModelForm):
    # --- Seção: Crie sua conta ---
    username = forms.CharField(
        max_length=150, 
        label="Nome de Usuário (Login único)",
        widget=forms.TextInput(attrs={'placeholder': 'Ex: joaosilva', 'class': 'input-auth'})
    )
    email = forms.EmailField(
        label="E-mail profissional",
        widget=forms.EmailInput(attrs={'placeholder': 'seu@email.com', 'class': 'input-auth'})
    )
    password = forms.CharField(
        label="Defina sua senha",
        widget=forms.PasswordInput(attrs={'placeholder': 'No mínimo 6 caracteres', 'class': 'input-auth'})
    )
    
    # --- Seção: Dados da sua loja ---
    nome_loja = forms.CharField(
        max_length=150, 
        label="Nome da sua Marca/Loja",
        widget=forms.TextInput(attrs={'placeholder': 'Ex: Jo Perfumes Importados', 'class': 'input-auth'})
    )
    slug_loja = forms.CharField(
        max_length=50,
        label="Link exclusivo da sua loja",
        help_text="Como seus clientes vão acessar",
        widget=forms.TextInput(attrs={'placeholder': 'ex: joperfumes', 'class': 'input-auth'})
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if password:
            validate_password(password)
        return password

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Este e-mail já está cadastrado em nossa plataforma.")
        return email

    def clean_slug_loja(self):
        slug = self.cleaned_data.get('slug_loja', '').lower().strip()
        # Remove caracteres especiais e espaços
        slug = re.sub(r'[^a-z0-9-]', '', slug.replace(' ', '-'))
        
        if slug in SLUGS_RESERVADOS:
            raise forms.ValidationError("Este nome de link é reservado pela plataforma. Escolha outro.")
        
        if Loja.objects.filter(slug=slug).exists():
            raise forms.ValidationError("Este link de loja (slug) já está em uso. Tente outro nome.")
        return slug

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
            # Criar Account
            account = Account.objects.create(nome=self.cleaned_data['nome_loja'])
            AccountUser.objects.create(account=account, user=user, role='owner', status='active')
            
            # Criar Plan basic e Subscription
            plan, _ = Plan.objects.get_or_create(
                nome='basic',
                defaults={
                    'max_lojas': 1,
                    'max_produtos_por_loja': 10,
                    'max_usuarios': 1,
                    'preco_mensal': 0
                }
            )
            Subscription.objects.create(account=account, plan=plan, status='active')
            
            can, msg = can_add_loja(account)
            if not can:
                raise forms.ValidationError(msg)
                
            # Criar a loja automaticamente com os dados validados
            Loja.objects.create(
                account=account,
                owner=user,
                nome=self.cleaned_data['nome_loja'],
                slug=self.cleaned_data['slug_loja'],
                whatsapp_numero='5500000000000' # Placeholder inicial para completar no dashboard
            )
        return user
