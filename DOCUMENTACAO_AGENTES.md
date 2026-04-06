# 🤖 Guia Oficial: Agentes de IA (Beta)

Bem-vindo ao **Centro de Inteligência** do seu SaaS! Este documento é o seu manual completo para entender, usar e extrair o máximo de valor dos seus novos assistentes virtuais.

---

## 🏗️ O que são os Agentes de IA?

Os agentes são "funcionários digitais" que residem no seu dashboard. Eles processam informações da sua loja e ajudam em tarefas que normalmente tomariam horas.

| Agente | Especialidade | Quando usar? |
|---|---|---|
| **🖋️ Copywriter Pro** | Persuasão e Escrita | Criar descrições, anúncios e legendas. |
| **📈 Estrategista** | Dados e Crescimento | Pedir dicas de vendas e analisar problemas da loja. |

---

## 📖 TUTORIAL 1: Criando a Descrição de um Produto

Se você tem um produto novo e não sabe como descrevê-lo para vender, siga estes passos:

1. Acesse o **Dashboard** da sua loja.
2. No menu lateral, clique em **Agentes IA**.
3. Clique no botão **"Ativar Agente"** do card **Copywriter Pro**.
4. No chat, digite as características básicas: 
   - *Ex: "Vender perfume de lavanda para presente de dia das mães"*
5. Pressione **Enter**.
6. **Resultado**: A IA gerará um texto com gatilhos mentais (escassez, urgência e exclusividade) que você pode copiar e colar no seu catálogo.

---

## 📖 TUTORIAL 2: Pedindo ajuda para Vender Mais

O Estrategista funciona como um consultor de negócios 24/7.

1. Abra o chat do **Estrategista de Vendas**.
2. Pergunte sobre uma dificuldade específica:
   - *Ex: "Tenho muitas visitas mas ninguém compra. O que fazer?"*
3. **Dica**: Seja específico. O agente simulado está treinado para sugerir táticas de **Escassez** e **Social Proof** (Prova Social).
4. Aplique as sugestões alterando as cores ou o banner da sua loja na aba **Aparência**.

---

## ⚙️ GUIA TÉCNICO: Ativando a "IA Real" (n8n)

Por padrão, os agentes rodam em **Modo Simulado** (sem custo e sem internet). Para conectar uma IA como o ChatGPT (OpenAI) ou Claude (Anthropic):

1. **Instale o n8n**: Siga o guia no arquivo principal para subir via Docker ou npm.
2. **Crie um Workflow**: 
   - Use um nó de **Webhook** (POST).
   - Conecte a um nó de **AI Agent** do n8n.
   - Finalize com um **Respond to Webhook**.
3. **Configure no SaaS**:
   - Vá em **Configurações da Loja**.
   - Insira a URL do Webhook do n8n no campo `n8n Webhook URL`.
4. **Pronto**: O sistema enviará os prompts automaticamente para o seu n8n.

---

## 🚨 Solução de Problemas

- **Chat diz "IA está pensando..." e não responde**: Verifique se o servidor Django no seu terminal não travou. No modo simulado, ele deve responder em até 2 segundos.
- **Erro de Conexão**: Se você configurou uma URL de n8n e ela estiver errada ou o n8n estiver desligado, o chat mostrará erro. Remova a URL na configuração para voltar ao Modo Simulado.

---

**Dúvidas?** Consulte o Guia Principal em `COMO_RODAR_O_PROJETO.md` ou abra um ticket. 🚀
