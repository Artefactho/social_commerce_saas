import os
import django
from django.core.files import File

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from produtos.models import Loja, Produto

loja = Loja.objects.get(slug='jo-perfumes')

logo_src = r"C:\Users\Artefactho\Downloads\JO PERFUMES\LOGO.jpeg"
if os.path.exists(logo_src):
    with open(logo_src, 'rb') as f:
        loja.logo.save("LOGO.jpeg", File(f), save=True)

Produto.objects.filter(loja=loja).delete()

produtos_list = [
    ('Brand Collection Nº 007 (Fem)', 129.90, 'PRODUTO 1.jpeg'),
    ('Brand Collection Nº 324 - La Belle (Fem)', 139.90, 'PRODUTO 2.jpeg'),
    ('Brand Collection Nº 012 (Fem)', 129.90, 'PRODUTO 3.jpeg'),
    ('Brand Collection Nº 325 - Le Manly Parfum (Masc)', 149.90, 'PRODUTO 4.jpeg'),
    ('Brand Collection Nº 323 - Le Manly Elixir (Masc)', 149.90, 'PRODUTO 5.jpeg'),
    ('Brand Collection Oud & Wood', 159.90, 'PRODUTO 6.jpeg'),
    ('Brand Collection Summer Citrus', 119.90, 'PRODUTO 7.jpeg'),
]

for nome, preco, filename in produtos_list:
    p = Produto.objects.create(
        nome=nome,
        loja=loja,
        marca='Brand Collection',
        preco=preco,
        descricao='Excelente fixação e projeção na pele. Uma joia em forma de perfume.',
        estoque=10,
        ativo=True
    )
    img_src = os.path.join(r"C:\Users\Artefactho\Downloads\JO PERFUMES", filename)
    if os.path.exists(img_src):
        with open(img_src, 'rb') as f:
            p.imagem.save(filename, File(f), save=True)

print('Imagens acopladas com sucesso!')
