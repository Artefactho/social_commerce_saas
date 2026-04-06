import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from produtos.models import Loja, Produto

loja, _ = Loja.objects.get_or_create(
    slug='jo-perfumes',
    defaults={
        'nome': 'Jô Perfumes',
        'cor_principal': '#d52b52', 
        'tema_escolhido': 'Elegante',
        'whatsapp_numero': '5511999999999'
    }
)
loja.nome = 'Jô Perfumes'
loja.save()

produtos = [
    ('Brand Collection Nº 007 (Fem)', 129.90),
    ('Brand Collection Nº 324 - La Belle (Fem)', 139.90),
    ('Brand Collection Nº 012 (Fem)', 129.90),
    ('Brand Collection Nº 325 - Le Manly Parfum (Masc)', 149.90),
    ('Brand Collection Nº 323 - Le Manly Elixir (Masc)', 149.90)
]

for nome, preco in produtos:
    Produto.objects.get_or_create(
        nome=nome,
        loja=loja,
        defaults={
            'marca': 'Brand Collection',
            'preco': preco,
            'descricao': 'Fragrância inspirada em grandes sucessos internacionais.',
            'estoque': 10,
            'ativo': True
        }
    )

print('Loja e perfumes injetados no banco de dados com sucesso!')
