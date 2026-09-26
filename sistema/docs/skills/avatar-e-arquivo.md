# Skill — Avatar e arquivo de usuário

## Quando isso se aplica

Qualquer funcionalidade onde uma entidade (usuário, loja) tem uma imagem ou arquivo
associado que precisa ser enviado (upload), guardado, e depois exibido de volta.
Neste projeto isso hoje é logo de loja (`stores.logo_url`) e imagem de produto
(`products.image_url`) — não há avatar de usuário pessoal ainda, mas o padrão é o
mesmo e se estende naturalmente se um dia existir. Se o projeto não tem entidade com
imagem/arquivo associado, essa skill não se aplica — não force o padrão onde não há
necessidade real.

## Como isso já é implementado neste projeto (referência concreta, não hipotética)

- **Bucket**: `products` (Supabase Storage, privado — ver `adr/0004-storage.md`),
  reaproveitado tanto para imagem de produto quanto para logo de loja, sem bucket
  novo por tipo de conteúdo.
- **Isolamento por pasta**: `{store_id}/{product_id}/{arquivo}` para produto,
  `{store_id}/logo/{arquivo}` para logo — RLS do bucket restringe escrita a membro
  da organização dona daquele `store_id` (mesma regra de isolamento de tenant do
  resto do projeto).
- **Referência no banco**: `products.image_url`/`stores.logo_url` guardam só o
  **caminho** (`filePath`), nunca o binário. Ex.:
  `stores.logo_url = "a1b2.../logo/x7k9m2.png"`.
- **Nome de arquivo**: gerado no cliente com `Math.random().toString(36).substring(2)`
  \+ extensão original — nunca reaproveita o nome enviado pelo usuário no `filePath`
  (evita path traversal).
- **Acesso**: bucket é sempre privado; a exibição (mesmo em página pública, como a
  vitrine) sempre passa por `createSignedUrl(path, 31536000)` — 1 ano de validade.
  Não existe hoje distinção "público direto" vs. "assinado curto"; se um dia entrar
  um arquivo genuinamente sensível (ex.: documento de identidade), a decisão de usar
  validade **curta** (minutos/horas) em vez desse padrão de 1 ano precisa ser tomada
  explicitamente naquele momento — não herdar o padrão de imagem de vitrine sem
  revisar.
- **Validação no upload** (já implementada em `ProductModal.tsx` e `Dashboard.tsx`):
  whitelist de MIME type (`image/jpeg`, `image/png`, `image/webp`, e `image/svg+xml`
  no caso do logo) e limite de tamanho (5MB produto, 2MB logo).

## O que perguntar antes de estender esse padrão (ambiguidade de alto impacto)

- O novo arquivo é genuinamente sensível (documento pessoal, não só imagem estética
  de vitrine)? Se sim, **não herdar** a validade de 1 ano — decidir uma validade
  curta explicitamente.
- Qual o limite de tamanho aceitável para esse novo tipo de arquivo? (Não assumir o
  mesmo valor de produto/logo sem confirmar.)
- O arquivo antigo deve ser apagado quando um novo for enviado, ou mantido como
  histórico? Hoje nem produto nem logo apagam o arquivo antigo do bucket ao trocar
  (fica órfão) — ASSUMPTION de baixo impacto já em produção, aceitável no volume
  atual, mas vale reavaliar se o volume de storage crescer.
