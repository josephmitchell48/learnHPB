const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '')

const removeWebOutputPrefix = (value: string) =>
  value.replace(/^webOutput\/?/, '').replace(/^\/+/, '')

const httpPattern = /^https?:\/\//i

const buildDefaultBaseUrl = () => {
  const base = import.meta.env.BASE_URL ?? '/'
  const withoutTrailingSlash = base.replace(/\/$/, '')
  return `${withoutTrailingSlash}/webOutput`
}

const rawBaseUrl = import.meta.env.VITE_CASE_ASSET_BASE_URL?.trim()
const debugFlag =
  String(import.meta.env.VITE_CASE_ASSET_DEBUG ?? '').toLowerCase() === 'true'
const shouldLogAssets = import.meta.env.DEV || debugFlag

export const logCaseAssetDebug = (...args: unknown[]) => {
  if (!shouldLogAssets) {
    return
  }
  console.info('[case-assets]', ...args)
}

export const caseAssetBaseUrl = trimTrailingSlash(
  rawBaseUrl && rawBaseUrl.length > 0 ? rawBaseUrl : buildDefaultBaseUrl(),
)

logCaseAssetDebug('Resolved case asset base URL:', caseAssetBaseUrl || '(empty)')

export const resolveCaseAssetUrl = (
  relativePath?: string | null,
): string | undefined => {
  if (!relativePath) {
    logCaseAssetDebug('resolveCaseAssetUrl called with empty path')
    return undefined
  }

  const trimmedPath = relativePath.trim()
  if (!trimmedPath) {
    logCaseAssetDebug('resolveCaseAssetUrl received whitespace path')
    return undefined
  }

  if (httpPattern.test(trimmedPath)) {
    logCaseAssetDebug('Using absolute asset URL:', trimmedPath)
    return trimmedPath
  }

  const normalizedPath = removeWebOutputPrefix(trimLeadingSlash(trimmedPath))
  const finalUrl = `${caseAssetBaseUrl}/${normalizedPath}`
  logCaseAssetDebug('Resolved asset path:', normalizedPath, '→', finalUrl)
  return finalUrl
}
