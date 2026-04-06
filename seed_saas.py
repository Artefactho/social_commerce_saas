import os
import django

# SETTINGS SETUP
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from produtos.models import Template, Loja

def seed_templates():
    print("Iniciando Seed de Templates SaaS V4...")
    
    templates_data = [
        {
            'nome': 'Elegante',
            'slug': 'elegante',
            'layout_padrao': 'grid'
        },
        {
            'nome': 'Corporativo',
            'slug': 'corporativo',
            'layout_padrao': 'lista'
        },
        {
            'nome': 'Studio',
            'slug': 'studio',
            'layout_padrao': 'grid'
        },
        {
            'nome': 'Minimalista',
            'slug': 'minimalista',
            'layout_padrao': 'grid'
        },
        {
            'nome': 'Clássico',
            'slug': 'classico',
            'layout_padrao': 'grid'
        },
    ]

    for data in templates_data:
        template, created = Template.objects.update_or_create(
            slug=data['slug'],
            defaults={'nome': data['nome'], 'layout_padrao': data['layout_padrao']}
        )
        if created:
            print(f"✅ Template {template.nome} CRIADO.")
        else:
            print(f"🔄 Template {template.nome} ATUALIZADO.")

    # Garantir que todas as lojas tenham um template default se estiverem NULL
    primeiro_template = Template.objects.get(slug='elegante')
    lojas_sem_template = Loja.objects.filter(template__isnull=True)
    if lojas_sem_template.exists():
        lojas_sem_template.update(template=primeiro_template)
        print(f"🛠️ {lojas_sem_template.count()} lojas atualizadas para o template default.")

if __name__ == "__main__":
    seed_templates()
    print("Seed concluído com sucesso!")
