import { updatePost } from "../lib/edgeFunctionsPaths"
import { buildPostFormData, getPasswordRequiredError, handleRequest } from "@shared/services/requestHelpers"
import type { UpdatePostServiceParams } from "@shared/types/post"

export default async function updatePostService({
  id,
  category,
  title,
  preview,
  content_markdown,
  banner,
  images,
  password
}: UpdatePostServiceParams) {

  const passwordError = getPasswordRequiredError(password)

  if (passwordError) return passwordError

  const form = buildPostFormData({
    id,
    category,
    title,
    preview,
    content_markdown,
    banner,
    images,
    password
  })

  const result = await handleRequest(fetch(updatePost, {
    method: "PUT",
    body: form
  }))

  console.log(result.status, result.data)
  return result
}