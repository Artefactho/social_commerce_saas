import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from produtos.models import Template

# Remove duplicates or old ones if needed
Template.objects.filter(slug__in=['app_studio', 'jo_perfumes']).delete()

t1, _ = Template.objects.get_or_create(
    nome='Tema Premium - App Studio',
    slug='app_studio',
    defaults={'layout_padrao': 'grid'}
)
print(f"Created/Updated template: {t1.nome}")

t2, _ = Template.objects.get_or_create(
    nome='Tema Exclusivo - Jo Perfumes',
    slug='jo_perfumes',
    defaults={'layout_padrao': 'grid'}
)
print(f"Created/Updated template: {t2.nome}")

print("Registrados no banco com sucesso!")
