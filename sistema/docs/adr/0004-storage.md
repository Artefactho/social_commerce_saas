# ADR-0004: Storage de arquivos/imagens

**Status:** aceito
**Data:** 2026-09-13
**Decisor(es):** dono do produto

---

## Contexto

Supabase Storage já está implementado no código Lovable avaliado: bucket privado
`products`, políticas RLS por pasta `{store_id}/...`, signed URLs já usadas no
dashboard e na vitrine pública.

## Opções consideradas

| Opção | Prós | Contras |
|---|---|---|
| **A. Supabase Storage (manter)** | Zero retrabalho — upload, signed URL e policy por pasta já escritos e funcionando; por baixo já é uma API na frente de um bucket S3 (inclusive em self-host) — migrar para S3 no futuro é trocar a implementação por baixo, não o modelo de dados nem o código de frontend | Menos controle fino de CDN/cache do que CloudFront direto |
| **B. S3 direto + presigned URLs próprias + CloudFront** | Mais "AWS nativo"; CDN de borda mais maduro | Reescreve toda a lógica de upload/URL assinada/policy por pasta que já existe e funciona; ganho só aparece em escala grande |

## Decisão

Manter **Supabase Storage** para o MVP e para a fase de self-host em AWS (ADR-0006) —
o bucket físico passa a ser um S3 que o próprio dono possui quando self-hospedar, sem
reescrever `PublicStore.tsx`/dashboard. Reavaliar S3+CloudFront direto só na Fase 8
(Escala), se custo de storage ou necessidade de CDN de borda para imagens de produto
justificar.

## Consequências

Nenhum retrabalho de upload/signed URL no MVP. Ao migrar para self-host AWS na Fase 8,
o bucket S3 por trás do Supabase Storage self-hosted já fica sob controle direto da
conta AWS do dono, sem precisar reescrever componentes de frontend.

## Relacionado

- `ARQUITETURA_TECNICA.md` seção 4
- ADR-0006 (deploy)
