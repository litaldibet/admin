import { resolvePostImagesBucket } from "@shared/constants/storage"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ""
const POST_IMAGES_BUCKET = resolvePostImagesBucket(import.meta.env.VITE_POST_IMAGES_BUCKET)

function normalizeStoragePath(path: string): string {
  const trimmed = path.trim().replace(/^['"]|['"]$/g, "")
  const withoutDotPrefix = trimmed.replace(/^\.\//, "")
  const withoutLeadingSlash = withoutDotPrefix.replace(/^\//, "")

  if (withoutLeadingSlash.startsWith(`${POST_IMAGES_BUCKET}/`)) {
    return withoutLeadingSlash.slice(POST_IMAGES_BUCKET.length + 1)
  }

  return withoutLeadingSlash
}

function encodePathSegments(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export function isAbsoluteOrSpecialUrl(url: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url) ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#")
}

export function buildStoragePublicUrl(path: string): string {
  if (!SUPABASE_URL) {
    return path
  }

  const normalizedPath = normalizeStoragePath(path)

  if (!normalizedPath) {
    return path
  }

  const encodedPath = encodePathSegments(normalizedPath)

  return `${SUPABASE_URL}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${encodedPath}`
}
