import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.filter(is_superuser=True).first()
if u:
    u.set_password('admin123')
    u.save()
    print(f'Senha do superusuário {u.username} resetada para: admin123')
else:
    User.objects.create_superuser('admin', 'admin@exemplo.com', 'admin123')
    print('Novo superusuário admin criado com senha admin123')
