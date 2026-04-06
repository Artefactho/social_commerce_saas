import pytest
from unittest.mock import MagicMock

@pytest.fixture(autouse=True)
def mock_celery(settings, monkeypatch):
    """
    Desabilita Celery real nos testes.
    """
    settings.CELERY_TASK_ALWAYS_EAGER = True
    
    # Mocking delay and apply_async directly on the task objects
    from produtos import tasks
    monkeypatch.setattr(tasks.enviar_para_n8n, "delay", MagicMock())
    monkeypatch.setattr(tasks.liberar_estoque_expirado, "apply_async", MagicMock())
