import { loadCards } from '../lib/edgeFunctionsPaths'
import { handleRequest } from './shared/requestHelpers'

export default async function loadCardsService() {

  const result = await handleRequest(fetch(loadCards, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }))

  // Lembrar que entre os objetos retornados há apenas a URL do banner, não o file em sí, 
  // Então para exibir a imagem é necessário usar a URL retornada para buscar a imagem no servidor e exibi-la

  return result;
}