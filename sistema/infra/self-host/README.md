# Self-host Supabase em AWS (Fase 8 — Escala)

Conforme ADR-0006 (`../../docs/adr/0006-deploy.md`), o backend só migra de
Supabase Cloud para self-host em AWS (EC2/ECS Fargate + RDS, região
`sa-east-1`) na **Fase 8** do roadmap (`../../docs/ROADMAP_DE_EXECUCAO.md`) —
quando a escala justificar, não antes.

Vazio propositalmente por enquanto. Quando essa fase começar, este diretório
guarda o `docker-compose.yml` (ou equivalente ECS/Terraform) que roda os
mesmos containers do Supabase (GoTrue, PostgREST, Storage API, Realtime)
dentro da conta AWS do dono do produto, reaproveitando a mesma baseline de
`../../supabase/migrations/` sem reescrever nenhuma linha de aplicação.
