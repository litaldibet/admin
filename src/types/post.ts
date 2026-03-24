export type PostImage = {
  file: File
  name: string
}

export type BasePostServiceParams = {
  category: string
  title: string
  preview: string
  content_markdown: string
  banner: File | null
  images: PostImage[]
  password: string
}

export type BuildPostFormDataParams = BasePostServiceParams & {
  id?: string
}

export type UploadPostServiceParams = BasePostServiceParams

export type UpdatePostServiceParams = BasePostServiceParams & {
  id: string
}