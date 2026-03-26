import { loadPost } from '../lib/edgeFunctionsPaths'
import { handleRequest } from '@shared/services/requestHelpers'

export default async function loadPostService(id: string) {

  const url = `${loadPost}?id=${encodeURIComponent(id)}`

  const result = await handleRequest(fetch(url, {
    method: "GET"
  }))

  // Lembrar que entre os objetos retornados há apenas a URL do banner e das imagens, não o file em sí, 
  // Então para exibir a imagem é necessário usar a URL retornada para buscar a imagem no servidor e exibi-la


  return result;
}