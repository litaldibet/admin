import { deletePost } from "../lib/edgeFunctionsPaths"
import { getPasswordRequiredError, handleRequest } from "./shared/requestHelpers"

export default async function deletePostService(id: string, password: string) {

  const passwordError = getPasswordRequiredError(password)

  if (passwordError) return passwordError

  const result = await handleRequest(fetch(deletePost, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: id,
      password: password
    })
  }))

  console.log("STATUS:", result.status)
  console.log("RESPOSTA:", result.data)

  return result

}