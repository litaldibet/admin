import { deletePost } from "../lib/edgeFunctionsPaths"

export default async function deletePostService(id: string, password: string) {

    if(!password) {
        return 
        /*  
            Vou decidir depois o protocolo de erro, talvez lançar uma exceção ou retornar um objeto específico. 
            Mas teoricamente, a senha nunca vai vir nula, pois o campo é obrigatório no formulário. De qualquer forma, é bom ter essa verificação para evitar chamadas desnecessárias à API.
        */
    }

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
      data = text
    }

    console.log("STATUS:", res.status)
    console.log("RESPOSTA:", data)

    return { status: res.status, data: data }

  } catch (err) {
    console.error("ERRO NA REQUISIÇÃO:", err)
    return err
  }

}