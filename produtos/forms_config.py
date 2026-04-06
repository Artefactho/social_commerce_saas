from django import forms
from .models import Loja

class LojaConfigForm(forms.ModelForm):
    class Meta:
        model = Loja
        fields = ['nome', 'whatsapp_numero', 'instagram_url', 'facebook_url', 'cor_principal', 'subtitulo_loja', 'tema_escolhido']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'input-custom'}),
            'whatsapp_numero': forms.TextInput(attrs={'class': 'input-custom', 'placeholder': 'Ex: 5511999999999'}),
            'instagram_url': forms.URLInput(attrs={'class': 'input-custom', 'placeholder': 'https://instagram.com/sua-loja'}),
            'facebook_url': forms.URLInput(attrs={'class': 'input-custom', 'placeholder': 'https://facebook.com/sua-loja'}),
            'cor_principal': forms.TextInput(attrs={'class': 'input-custom', 'type': 'color', 'style': 'height: 60px; padding: 5px;'}),
            'subtitulo_loja': forms.TextInput(attrs={'class': 'input-custom', 'placeholder': 'Ex: Perfumes Importados e Fragrâncias Exclusivas'}),
            'tema_escolhido': forms.Select(attrs={'class': 'input-custom'}),
        }
