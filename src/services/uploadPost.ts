import { createPost } from "../lib/edgeFunctionsPaths"
import { buildPostFormData, getPasswordRequiredError, handleRequest } from "@shared/services/requestHelpers"
import type { UploadPostServiceParams } from "@shared/types/post"

export default async function uploadPostService({
  category,
  title,
  preview,
  content_markdown,
  active,
  banner,
  images,
  password
}: UploadPostServiceParams) {

  const passwordError = getPasswordRequiredError(password)

  if (passwordError) return passwordError

  const form = buildPostFormData({
    category,
    title,
    preview,
    content_markdown,
    active,
    banner,
    images,
    password
  })

  const result = await handleRequest(fetch(createPost, {
    method: "POST",
    body: form
  }))

  console.log(result.status, result.data)
  return result
}