A arquitetura baseada em Markdown + armazenamento de imagens em object storage funciona como um pequeno CMS desacoplado. A ideia central é separar o conteúdo textual (armazenado como Markdown no banco) dos arquivos binários (imagens) armazenados em um serviço de storage, enquanto o frontend converte o Markdown em HTML no momento da renderização.

No seu caso, a arquitetura se encaixa bem porque o projeto já está dividido em três camadas: admin-page, backend no Supabase e webapp final em React.

No admin-page, que é um site simples feito com Vite e JavaScript, o usuário responsável pelo conteúdo cria novos posts. O campo principal do formulário é um editor de texto onde o conteúdo é escrito em Markdown. Markdown é uma linguagem de marcação leve que permite representar elementos de formatação comuns de texto usando uma sintaxe simples. Por exemplo, títulos podem ser escritos com #, texto em negrito com **texto**, e imagens com a sintaxe ![descrição](url-da-imagem). Como o Markdown é texto puro, ele pode ser armazenado diretamente no banco sem qualquer transformação inicial.

Quando o administrador precisa inserir uma imagem no conteúdo, o fluxo não envolve o banco de dados diretamente. Em vez disso, a imagem é enviada para um serviço de armazenamento de objetos. No seu caso, isso seria o Supabase Storage, que funciona de forma semelhante ao Amazon S3. O admin-page envia a imagem para o storage através da API do Supabase, normalmente dentro de um bucket específico, como post-images. Após o upload, o storage retorna uma URL pública ou assinada que aponta para o arquivo armazenado.

Essa URL então é inserida automaticamente dentro do texto Markdown no editor. O conteúdo do post passa a conter algo como:

# Meu primeiro post

Este é um parágrafo com **texto em negrito**.

![Imagem ilustrativa](https://projeto.supabase.co/storage/v1/object/public/post-images/imagem123.png)

Outro parágrafo abaixo da imagem.

Quando o administrador termina de escrever o conteúdo e envia o formulário, o admin-page faz uma requisição para uma Edge Function do Supabase. As Supabase Edge Functions funcionam como endpoints serverless que permitem validar e manipular dados antes de armazená-los. Essa função recebe os dados do post (por exemplo: título, slug, conteúdo em Markdown, data de criação) e grava essas informações na tabela de posts do banco.

No banco de dados, geralmente uma única tabela já é suficiente para armazenar os posts. Um exemplo de estrutura seria:

id – identificador do post

title – título do post

slug – identificador amigável usado na URL

content – texto completo do post em Markdown

created_at – data de criação

updated_at – data de atualização

O campo content armazena exatamente o Markdown escrito no admin, incluindo as URLs das imagens que estão no storage.

A webapp final, construída com React e TypeScript, é responsável por consumir esses dados e renderizar o conteúdo para o usuário final. Quando um visitante acessa um post, o frontend faz uma requisição para buscar os dados desse post no Supabase. O campo content retorna o Markdown bruto.

Para transformar esse Markdown em HTML exibível no navegador, o frontend utiliza um parser de Markdown. Uma biblioteca comum para isso é o React Markdown, que converte automaticamente o texto Markdown em elementos React correspondentes. Dessa forma, títulos são convertidos em <h1>, <h2>, etc., negrito em <strong>, parágrafos em <p>, e imagens em <img> apontando para as URLs que vieram do storage.

O resultado é que o frontend recebe apenas texto estruturado, converte esse texto em HTML durante a renderização e exibe o conteúdo completo do post, incluindo as imagens. Como as imagens estão hospedadas no storage, o navegador as carrega diretamente via HTTP, sem necessidade de passar novamente pelo backend.

Essa arquitetura possui algumas vantagens importantes. Primeiro, o banco de dados armazena apenas texto, o que mantém os registros leves e fáceis de versionar. Segundo, os arquivos binários ficam em um sistema de storage otimizado para servir arquivos estáticos. Terceiro, o Markdown é uma tecnologia extremamente difundida e fácil de processar, o que evita a necessidade de criar um parser customizado ou um sistema próprio de formatação.

No fluxo completo do sistema, o ciclo de vida de um post funciona assim: o administrador escreve o conteúdo em Markdown no admin-page, faz upload das imagens para o storage e insere suas URLs no texto, envia o conteúdo para uma Edge Function que salva o post no banco, e posteriormente o frontend React consulta esse post, converte o Markdown em HTML e renderiza o conteúdo final para os usuários.

Essa abordagem é considerada uma arquitetura comum para pequenos CMS e blogs porque mantém simplicidade estrutural, boa separação de responsabilidades e fácil manutenção.