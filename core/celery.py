import os
from celery import Celery

# Define as configurações padrão do Django para o Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Usar namespace 'CELERY' significa que todas configurações no settings correspondentes no Django precisam iniciar com CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover tenta encontrar tarefas em cada um dos apps listados em INSTALLED_APPS
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
