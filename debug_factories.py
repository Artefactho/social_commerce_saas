import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from produtos.tests.factories import LojaFactory, ProdutoFactory
l = LojaFactory()
print(f"Loja: {l.nome}, Slug: {l.slug}")
p = ProdutoFactory(loja=l)
print(f"Produto: {p.nome}, Estoque: {p.estoque}")
