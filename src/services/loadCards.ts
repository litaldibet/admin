import { loadCards } from '../lib/edgeFunctionsPaths'
import type { LoadCardsResponse } from '@shared/contracts/loadCards'
import { handleTypedRequest } from '@shared/services/requestHelpers'

export default async function loadCardsService() {
  const url = `${loadCards}?include_inactive=true`

  const result = await handleTypedRequest<LoadCardsResponse>(fetch(url, {
    method: "GET"
  }))

  return result
}