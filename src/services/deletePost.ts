import { deletePost } from "../lib/edgeFunctionsPaths"

export default async function deletePostService(id: string, password: string) {

    if(!password) return { status: 400, data: null, error: "PASSWORD_REQUIRED" }
    
    try {

    const res = await fetch(deletePost, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id,
        password: password
      })
    })

    const text = await res.text()

    let data

    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    console.log("STATUS:", res.status)
    console.log("RESPOSTA:", data)

    return { status: res.status, data: data, error: null }

  } catch (err) {
    console.error("ERRO NA REQUISIÇÃO:", err)
    return { status: 0, data: null, error: err }
  }

}