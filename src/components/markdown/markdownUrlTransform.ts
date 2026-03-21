import { buildStoragePublicUrl, isAbsoluteOrSpecialUrl } from "./storagePublicUrl"

export function transformMarkdownAssetUrl(url: string, key: string): string {
  if (key !== "src") {
    return url
  }

  if (!url || isAbsoluteOrSpecialUrl(url)) {
    return url
  }

  return buildStoragePublicUrl(url)
}
