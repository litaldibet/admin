# LitaldiBet Admin

Painel administrativo em React + Vite para criar e editar posts do projeto LitaldiBet.

## Requisitos

- Node.js 20+
- pnpm
- Acesso ao projeto Supabase usado pelo admin

## Variaveis de ambiente

Crie um arquivo .env na raiz deste projeto com:

VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
VITE_POST_IMAGES_BUCKET=post-images

Observacoes:

- A anon key do Supabase pode ficar no frontend.
- Nao use service role key no frontend.

## Desenvolvimento local

1. Instale dependencias:

pnpm install

2. Rode em modo desenvolvimento:

pnpm dev

## Build de producao

pnpm build

A saida fica na pasta dist.

## Deploy no GitHub Pages

Este projeto usa gh-pages para publicar a pasta dist na branch gh-pages.

### Primeira publicacao

1. Garanta que a branch main esteja no remoto.
2. Execute:

pnpm deploy

Como existe o script predeploy, o build roda automaticamente antes da publicacao.

3. No GitHub, abra o repositorio e configure:

- Settings > Pages
- Source: Deploy from a branch
- Branch: gh-pages
- Folder: /(root)

4. Salve e aguarde o Pages gerar a URL publica.

### Publicacoes seguintes (atualizacoes)

Sempre que fizer alteracoes no admin:

1. Commit e push na main normalmente.
2. Rode novamente:

pnpm deploy

O comando reconstrui o projeto e atualiza a branch gh-pages com o novo conteudo.

## Como o deploy funciona

- pnpm deploy chama gh-pages -d dist.
- gh-pages cria/atualiza a branch gh-pages com os arquivos estaticos da dist.
- GitHub Pages serve exatamente o conteudo dessa branch.

Nao depende de GitHub Actions para funcionar.

## Troubleshooting rapido

1. Pagina abre sem estilo ou sem script:
- Confirme que o base em vite.config.ts esta como /LitaldiBet-Admin/.

2. Erro de variavel undefined em runtime:
- Verifique se .env tem VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.

3. Deploy finaliza, mas site nao atualiza:
- Espere 1 a 3 minutos.
- Force refresh no navegador.
- Confira se a branch gh-pages recebeu commit novo.
