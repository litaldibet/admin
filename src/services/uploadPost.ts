import { createPost } from "../lib/edgeFunctionsPaths"

export default async function uploadPostService(
  category: string, 
  title: string, 
  preview: string, 
  content_markdown: string, 
  banner: File, 
  images: { file: File; name: string }[], 
  password: string) {

  if(!password) {
    return 
    /*  
        Vou decidir depois o protocolo de erro, talvez lançar uma exceção ou retornar um objeto específico. 
        Mas teoricamente, a senha nunca vai vir nula, pois o campo é obrigatório no formulário. De qualquer forma, é bom ter essa verificação para evitar chamadas desnecessárias à API.
    */
  }
  
  const form = new FormData()

  form.append("category", category)
  form.append("title", title)
  form.append("preview", preview)
  form.append("content_markdown",content_markdown)
  form.append( "banner", banner, "banner")

  for (const image of images) {
    form.append("images", image.file, image.name)
  }

  form.append("password", password)

  const res = await fetch(createPost, {
    method: "POST",
    body: form 
  })

  const json = await res.json()

  console.log(res.status, json)
  return { status: res.status, data: json }
}