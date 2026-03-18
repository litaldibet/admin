import { createPost } from "../lib/edgeFunctionsPaths"

export default async function uploadPostService(
  category: string, 
  title: string, 
  preview: string, 
  content_markdown: string, 
  banner: File, 
  images: { file: File; name: string }[], 
  password: string) {

  if(!password) return { status: 400, data: null, error: "PASSWORD_REQUIRED" }

  
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

  try {
    const res = await fetch(createPost, {
      method: "POST",
      body: form 
    })

    const text = await res.text()

    let data

    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    console.log(res.status, data)
    return { status: res.status, data: data, error: null }
  } catch (err) {
    console.error("ERRO NA REQUISIÇÃO:", err)
    return { status: 0, data: null, error: err }
  }
}