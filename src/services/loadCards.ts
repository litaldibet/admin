import { loadCards } from '../lib/edgeFunctionsPaths'
import type { LoadCardsResponse } from '@shared/contracts/loadCards'
import { handleTypedRequest } from '@shared/services/requestHelpers'

export default async function loadCardsService() {
  const result = await handleTypedRequest<LoadCardsResponse>(fetch(loadCards, {
    method: "GET"
  }))

  return result
}