import type { BuildPostFormDataParams } from "../../types/post"

export type ServiceResult = {
  status: number
  data: unknown
  error: unknown
}

export function getPasswordRequiredError(password: string): ServiceResult | null {
  if (!password) {
    return { status: 400, data: null, error: "PASSWORD_REQUIRED" }
  }

  return null
}

export function buildPostFormData(params: BuildPostFormDataParams): FormData {
  const {
    id,
    category,
    title,
    preview,
    content_markdown,
    banner,
    images,
    password
  } = params

  const form = new FormData()

  if (id) {
    form.append("id", id)
  }

  form.append("category", category)
  form.append("title", title)
  form.append("preview", preview)
  form.append("content_markdown", content_markdown)
  form.append("banner", banner, "banner")

  for (const image of images) {
    form.append("images", image.file, image.name)
  }

  form.append("password", password)

  return form
}

export async function handleRequest(request: Promise<Response>): Promise<ServiceResult> {
  try {
    const res = await request
    const text = await res.text()

    let data: unknown

    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    return { status: res.status, data, error: null }
  } catch (error) {
    console.error("ERRO NA REQUISIÇÃO:", error)
    return { status: 0, data: null, error }
  }
}