# Plano de Implementação: Autenticação JWT para SaaS

**Status:** 📝 Planejamento (Aguardando Aprovação e Início via `/create`)
**Alvo:** Sistema SaaS Multi-tenant / API
**Autor (Agente):** `@project-planner` 

---

## 🎯 1. Visão Geral (Objetivo)
Implementar uma camada de autenticação segura e escalável baseada em **JWT (JSON Web Tokens)** para o backend Django do SaaS de e-commerce. A solução deve proteger rotas sensíveis, gerenciar duração e renovação de acesso (Refresh) e estar estruturalmente pronta para suportar o ecossistema multiusuário (Lojistas).

---

## 🏗️ 2. Arquitetura Proposta

### 2.1 Padrão de Autenticação (SimpleJWT)
O padrão ouro no Django Rest Framework para JWT. Usaremos o pacote `djangorestframework-simplejwt`.
- **Access Token:** Tempo de vida curto (ex: 15 a 30 minutos). Armazenado na memória ou LocalStorage.
- **Refresh Token:** Tempo de vida longo (ex: 7 a 14 dias). Armazenado em um cookie *HttpOnly* ou no cliente, utilizado para gerar novos Access Tokens transparentemente, para que o lojista não seja deslogado enquanto usa o painel.

### 2.2 Controle Multi-Tenant (SaaS)
O sistema deve reconhecer automaticamente as Lojas (Tenants) as quais o usuário logado possui acesso. O JWT encapsulará não apenas a ID do usuário, mas poderá conter ou carregar a identificação primária de acesso dele.

---

## 📋 3. Etapas de Desenvolvimento

A implementação será dividida em 4 fases claras. NENHUM código será escrito agora.

### FASE 1: Instalação e Configuração Base
*   [ ] Instalar `djangorestframework` e `djangorestframework-simplejwt` no `requirements.txt`.
*   [ ] Adicionar DRF e Rest Framework Token nas configurações de APPs do `settings.py`.
*   [ ] Configurar as variáveis e durações do JWT (`ACCESS_TOKEN_LIFETIME`, `REFRESH_TOKEN_LIFETIME`).
*   [ ] Ajustar a cadeia de autenticação (`REST_FRAMEWORK` -> `DEFAULT_AUTHENTICATION_CLASSES`).

### FASE 2: Sistema Core de Login e Tokens
*   [ ] Criar as rotas nativas de token: `/api/token/` (Login) e `/api/token/refresh/`.
*   [ ] Construir um serializer customizado (`CustomTokenObtainPairSerializer`) se houver necessidade de injetar dados da loja (SaaS) dentro do token JWT e não apenas do usuário.
*   [ ] Mapear regras CORS em preparação para integração com clientes Next.js/React ou Mobile.

### FASE 3: Endpoints de Usuários (SaaS-Ready)
*   [ ] Criar View/Serializer de **Registro / Onboarding**: Criptografia mandatória (via `make_password` ou signals no model).
*   [ ] Criar View/Serializer de **Validação de Sessão**: Endpoint (`/api/users/me/`) para o Frontend buscar quem é o usuário logado atualmente e recuperar as lojas que ele gerencia.
*   [ ] Proteção de ViewSets de Lojas e Produtos via `IsAuthenticated` combinada com restrição de objeto (`obj.owner == request.user`).

### FASE 4: Segurança e Refinamentos
*   [ ] Hash Ativo: Confirmação de que as senhas estão salvas nativamente como `pbkdf2_sha256`.
*   [ ] Implementar sistema de Blacklisting (Proteção extra): Permite quebrar efetivamente o login se houver troca de senha ou logout forçado, invalidando o Refresh Token no banco.

---

## ❓ 4. Questões Clarificadoras (Socratic Gate)

> 🔴 **Importante:** Responda essas perguntas diretas para me ajudar a alinhar o plano exato antes de chamarmos o agente programador.

1. **Uso dos Tokens:** Esse JWT servirá principalmente para liberar API para agentes (ex: n8n e simulações) no backend atual, ou se trata de uma preparação estrutural porque sua plataforma (Dashboard) ou Mobile vai usar Frameworks Javascript no futuro (Next.js/React)?
2. **Session vs JWT:** O painel de Lojista hoje parece rodar no backend clássico Django (Session Auth normal). O login do JWT vai ser restrito apenas a chamadas de API `/api/...` sem mexer no login por sessão existente da Landing Page e Dashboard, correto?
3. **Blacklist:** Deseja incluir imediatamente o sistema de *"Blacklist"*? (Isso permite que você deslogue, na marra, contas remotamente, mas usa acesso direto ao banco de dados sempre que um token tentar se atualizar).

---

## 🚀 Próximos Passos
Para converter este plano em código, basta me responder às perguntas acima e em seguida executar o comando:

`/create auth JWT conforme planejamento`
