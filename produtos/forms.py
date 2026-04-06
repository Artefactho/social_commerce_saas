from django import forms
from .models import Produto, Categoria

class ProdutoForm(forms.ModelForm):
    class Meta:
        model = Produto
        fields = ['nome', 'descricao', 'preco', 'estoque', 'imagem', 'categoria']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'input-custom', 'placeholder': 'Ex: Perfume Brand 007'}),
            'descricao': forms.Textarea(attrs={'class': 'input-custom', 'placeholder': 'Notas olfativas, duração, etc.', 'rows': 3}),
            'preco': forms.NumberInput(attrs={'class': 'input-custom', 'step': '0.01'}),
            'estoque': forms.NumberInput(attrs={'class': 'input-custom'}),
            'imagem': forms.FileInput(attrs={'class': 'input-custom'}),
            'categoria': forms.Select(attrs={'class': 'input-custom'}),
        }

    def __init__(self, *args, **kwargs):
        loja = kwargs.pop('loja', None)
        super().__init__(*args, **kwargs)
        if loja:
            self.fields['categoria'].queryset = Categoria.objects.filter(loja=loja)
