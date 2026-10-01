# Skill — Avatar e arquivo de usuário

## Quando isso se aplica

Qualquer funcionalidade onde um usuário tem uma imagem ou arquivo associado a
ele que precisa ser: enviado (upload), guardado, e depois exibido de volta
(foto de perfil, logo de organização, documento anexado). Se o projeto não tem
usuário com identidade visível (ex.: um sistema interno sem página pública por
pessoa), provavelmente essa skill não se aplica — não force o padrão onde não
há necessidade real.

## As decisões reais, nesta ordem

### 1. Onde o arquivo fica guardado

- **Armazenamento de objeto dedicado** (qualquer provedor de "bucket" —
  S3-compatível, ou equivalente): a opção padrão pra qualquer projeto com
  volume real de arquivo. Não guardar arquivo binário direto no banco de
  dados relacional (deixa o banco lento e caro de fazer backup).
- **Disco local do servidor**: só aceitável em protótipo/MVP muito inicial,
  sem plano de escalar horizontalmente (múltiplos servidores) — se o projeto
  crescer, isso vira dívida técnica rápido.

### 2. Como referenciar no banco

Guardar só o **caminho/chave** do arquivo no banco (uma string), nunca o
arquivo em si. Ex.: `avatar_key = "usuarios/42/avatar.jpg"`, não o binário.

### 3. Acesso público vs. privado

- Se a imagem é **pública por natureza** (avatar visível em página pública),
  pode usar URL pública direta.
- Se é **sensível** (documento de identidade, foto que só o próprio usuário e
  administrador devem ver), usar URL assinada/temporária (expira em minutos/
  horas), nunca deixar o bucket inteiro público. Ver também
  `template/CONSTITUTION.md` — regra de dado sensível/alto impacto.

### 4. Validação no upload

Sempre, independente do projeto:
- Limitar tipo de arquivo aceito (whitelist de extensão/MIME, não blacklist).
- Limitar tamanho máximo.
- Nunca confiar no nome de arquivo enviado pelo usuário sem sanitizar (risco
  de path traversal) — gerar nome novo no servidor, não reusar o nome
  original diretamente no caminho de armazenamento.

### 5. Redimensionamento/otimização (opcional, decidir por necessidade real)

Só vale a pena se o volume de acesso justificar — gerar variação pequena
(thumbnail) evita carregar imagem grande toda vez que só um ícone pequeno é
exibido. Não implementar isso preventivamente num projeto com poucos usuários;
é fácil adicionar depois quando o volume justificar.

## O que perguntar antes de implementar (ambiguidade de alto impacto)

- Existe algum dado sensível nesse arquivo (documento pessoal, não só foto
  estética)? Se sim, aplicar a regra de acesso privado/assinado, não pública.
- Qual o limite de tamanho aceitável? (Não assumir — perguntar ou definir
  explicitamente antes de codar.)
- O arquivo antigo deve ser apagado quando um novo for enviado (substituição),
  ou mantido como histórico? Ambas são válidas, mas mudam a lógica.
