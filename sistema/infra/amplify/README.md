# AWS Amplify Hosting (frontend)

Conforme ADR-0006 (`../../docs/adr/0006-deploy.md`), o frontend
(`../../frontend/`) é hospedado em **AWS Amplify Hosting** a partir do
primeiro deploy real (marco no fim da Fase 5, `../../docs/ROADMAP_DE_EXECUCAO.md`).

Nesta rodada de consolidação não foi criada nenhuma conta/app Amplify real —
isso é uma ação externa (console AWS) que o dono do produto executa
manualmente quando a Fase 5 começar. Este diretório existe para guardar,
quando chegar a hora: `amplify.yml` (build spec) e notas de configuração de
domínio/variáveis de ambiente do app Amplify.
