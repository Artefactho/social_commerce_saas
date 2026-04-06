# 🚀 Guia Oficial do Social Commerce SaaS

> [!IMPORTANT]
> **NOVIDADE: AGENTES DE IA (BETA)**
> Agora você pode turbinar suas vendas com o **Centro de Inteligência**. Acesse o seu Dashboard e teste o **Copywriter Pro** e o **Estrategista de Vendas**!
> Para tutoriais e guia técnico, consulte: **[DOCUMENTACAO_AGENTES.md](file:///C:/Users/Artefactho/.gemini/antigravity/scratch/social_commerce_saas/DOCUMENTACAO_AGENTES.md)**

Bem-vindo ao seu ecossistema de vendas online! Este guia explica como operar a sua plataforma.

---

## 📱 ACESSO RÁPIDO VIA CELULAR — Loja da Jô

> ⚠️ **Pré-requisito:** O celular deve estar na **mesma rede Wi-Fi** do computador.

Abra o navegador do celular e acesse:

```
http://192.168.1.3:8000/jo/
```

| O que acessar | URL no Celular |
|---|---|
| 🛍️ **Vitrine da Jô Perfumes** | http://192.168.1.3:8000/jo/ |
| 🏠 Landing Page SaaS | http://192.168.1.3:8000/ |
| 🛍️ Vitrine Loja Root | http://192.168.1.3:8000/loja-root/ |
| 🔑 Login | http://192.168.1.3:8000/accounts/login/ |
| 📊 Dashboard (atalho) | http://192.168.1.3:8000/dashboard/entrar/ |
| ⚙️ Admin Django | http://192.168.1.3:8000/admin/ |

> 💡 **Regra de ouro:** No celular, **sempre** use `192.168.1.3`. No PC pode usar os dois.

| ❌ NÃO funciona no celular | ✅ Funciona no celular |
|---|---|
| `http://127.0.0.1:8000/jo/` | `http://192.168.1.3:8000/jo/` |
| `http://127.0.0.1:8000/dashboard/jo/` | `http://192.168.1.3:8000/dashboard/jo/` |
| `http://127.0.0.1:8000/admin/` | `http://192.168.1.3:8000/admin/` |
| `http://127.0.0.1:8000/accounts/login/` | `http://192.168.1.3:8000/accounts/login/` |

---

## 🏗️ PASSO A PASSO COMPLETO — Subindo do Zero

O sistema depende de **três motores** rodando simultaneamente. Siga exatamente esta ordem:

---

### ✅ PASSO 1 — Iniciar o Docker Desktop

1. Abra o **Docker Desktop** (pelo menu Iniciar ou ícone na barra de tarefas).
2. Aguarde o ícone na bandeja ficar **verde** (Engine running).
3. Confirme no PowerShell que está rodando:

```powershell
docker ps
```

> Resultado esperado: cabeçalho com colunas `CONTAINER ID   IMAGE   ...` sem erros.

---

### ✅ PASSO 2 — Iniciar o Redis (Banco de Fila)

Abra um terminal **PowerShell** e rode:

```powershell
docker start redis-saas
```

> **Se aparecer erro "No such container"**, rode uma vez para criar e já iniciar:
> ```powershell
> docker run -d -p 6379:6379 --name redis-saas redis
> ```

Verifique se está rodando:

```powershell
docker ps
```

> Resultado esperado: linha com `redis-saas` e status `Up`.

---

### ✅ PASSO 3 — Iniciar o Celery (Processador de Pedidos)

Ainda no terminal (ou abra um **novo terminal**), navegue até a pasta do projeto e rode:

```powershell
cd C:\Users\Artefactho\.gemini\antigravity\scratch\social_commerce_saas
.\venv\Scripts\activate
.\venv\Scripts\celery -A core worker -l info --pool=solo
```

> ✅ Pronto quando aparecer: `celery@NOME-DO-PC ready.`
> 🚨 **Mantenha esta aba aberta!** Não feche.

---

### ✅ PASSO 4 — Iniciar o Django para Acesso via Celular

Abra um **novo terminal** (o Celery precisa continuar rodando no outro) e rode:

```powershell
cd C:\Users\Artefactho\.gemini\antigravity\scratch\social_commerce_saas
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

> ✅ Pronto quando aparecer:
> ```
> Starting development server at http://0.0.0.0:8000/
> Quit the server with CTRL-BREAK.
> ```
> 🚨 **Mantenha esta aba aberta!** Não feche.

---

### ✅ PASSO 5 — Acessar pelo Celular

1. Conecte o celular na **mesma rede Wi-Fi** do computador.
2. Abra o navegador do celular (Chrome, Safari, etc.).
3. Digite o endereço:

```
http://192.168.1.3:8000/jo/
```

> 💡 **Dica:** Salve nos favoritos do celular para não precisar digitar toda vez!

---

## 🌐 Links de Acesso — PC (localhost)

| O que acessar | URL |
|---|---|
| 🏠 Landing Page SaaS | http://127.0.0.1:8000/ |
| 🛍️ Vitrine da Jô Perfumes | http://127.0.0.1:8000/jo/ |
| 🛍️ Vitrine Loja Root | http://127.0.0.1:8000/loja-root/ |
| ➕ Cadastro de Nova Loja | http://127.0.0.1:8000/pj/cadastro/ |
| 🔑 Login | http://127.0.0.1:8000/accounts/login/ |
| 📊 Dashboard (atalho) | http://127.0.0.1:8000/dashboard/entrar/ |
| 📊 Dashboard Loja Root | http://127.0.0.1:8000/dashboard/loja-root/ |
| 📊 Dashboard Jô Perfumes | http://127.0.0.1:8000/dashboard/jo/ |
| ⚙️ Admin Django | http://127.0.0.1:8000/admin/ |

---

## 🔑 Credenciais de Acesso

| Perfil | Usuário | Senha | Acesso |
|---|---|---|---|
| 👑 Superusuário / Dono | `root` | `root123` | Dashboard + Admin |

> **Dica:** Acesse http://127.0.0.1:8000/dashboard/entrar/ após o login — ele te redireciona automaticamente para a sua loja.

---

## 🛍️ Lojas Cadastradas

| Loja | Slug | Vitrine (PC) | Vitrine (Celular) | Dashboard |
|---|---|---|---|---|
| Loja Root | `loja-root` | http://127.0.0.1:8000/loja-root/ | http://192.168.1.3:8000/loja-root/ | http://127.0.0.1:8000/dashboard/loja-root/ |
| Jô Perfumes | `jo` | http://127.0.0.1:8000/jo/ | http://192.168.1.3:8000/jo/ | http://127.0.0.1:8000/dashboard/jo/ |

---

## 🛍️ A Experiência do Lojista (Sua Esposa)

O lojista tem um fluxo guiado para garantir o sucesso da loja:

### A. Checklist de Sucesso (Onboarding)
- Ao entrar no Dashboard, um guia visual indica se falta:
  - Cadastrar o primeiro produto.
  - Organizar categorias.
  - Personalizar a identidade (Logo/Cores/WhatsApp).

### B. Gestão de Estoque & Vendas
- No Dashboard > **"Meus Produtos"**, é possível editar preços e estoques. Se o estoque baixar de 5 unidades, a vitrine ativa automaticamente o efeito de pulsação e urgência para o cliente final.

### C. Branding Instantâneo
- Em **"Personalizar Minha Loja"**, qualquer mudança de cor ou logo é aplicada na hora na vitrine do cliente.

---

## 🧪 Rodando os Testes

Para garantir que o motor de pagamentos e estoque está 100%:
```powershell
.\venv\Scripts\pytest -v
```
*O sistema foi blindado para processar vendas mesmo que o Redis/Docker sofra quedas momentâneas.*

---

## 🛑 Como Desligar

1. Nos terminais do **Django** e do **Celery**, pressione `Ctrl + C` para parar cada um.
2. Pare o Redis:
   ```powershell
   docker stop redis-saas
   ```
3. Feche o **Docker Desktop**.

---

## 🔧 Solução de Problemas

| Problema | Solução |
|---|---|
| Celular não acessa o link | Verifique se o celular está na **mesma rede Wi-Fi** |
| Celular não acessa o link | Confirme que o servidor foi iniciado com `0.0.0.0:8000` (não com `127.0.0.1`) |
| Docker não inicia | Abra o Docker Desktop e aguarde o ícone ficar verde |
| Erro ao iniciar Redis | Rode `docker run -d -p 6379:6379 --name redis-saas redis` para recriar |
| Página não carrega no PC | Verifique se o Django está rodando no terminal |
| IP mudou (link parou de funcionar) | Rode `ipconfig` e pague o novo IP com `Endereço IPv4: 192.168.x.x` |

---

## 🤖 NOVOS RECURSOS — Agentes de IA (BETA)

Agora o seu SaaS conta com uma equipe de especialistas prontos para ajudar o lojista.

### A. Como acessar
1. No Dashboard, clique na nova aba **"Agentes IA"**.
2. Você verá o **Centro de Inteligência** com os agentes disponíveis.

### B. Modo de Simulação Local (Atual)
Como o sistema está em fase Beta, implementamos um **Simulador de IA** que funciona sem dependências externas:
- **Copywriter Pro**: Peça sugestões de textos para seus produtos.
- **Estrategista**: Tire dúvidas sobre como melhorar as vendas da sua loja.

> 💡 **Dica:** Use o chat interativo para conversar com os agentes em tempo real.

### C. Integração com n8n (Produção)
Para ativar a inteligência real (GPT-4, Claude, etc.):
1. Configure um workflow no n8n.
2. Insira a URL do Webhook nas configurações da loja.
3. O sistema passará a ignorar o simulador e usará a sua IA customizada.

---

**Pronto! Seu SaaS está no ar e agora muito mais inteligente.** 🚀🤖✨
