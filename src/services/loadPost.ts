import { loadPost } from '../lib/edgeFunctionsPaths'
import { handleRequest } from './shared/requestHelpers'

export default async function loadPostService(id: string) {

  const result = await handleRequest(fetch(loadPost, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: id
    })
  }))



  return result;
}