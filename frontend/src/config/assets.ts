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

type ListingConfig = {
  origin: string
  basePrefix: string
}

const parseListingConfig = (): ListingConfig | null => {
  try {
    const normalized = caseAssetBaseUrl.endsWith('/')
      ? caseAssetBaseUrl
      : `${caseAssetBaseUrl}/`
    const parsed = new URL(normalized)
    const host = parsed.hostname.toLowerCase()
    const isS3Host = host.includes('.s3.') || host.endsWith('.amazonaws.com')
    if (!isS3Host) {
      logCaseAssetDebug(
        'Case asset listing disabled because host does not look like S3:',
        parsed.hostname,
      )
      return null
    }
    const basePrefix = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
    const normalizedPrefix = basePrefix.length > 0 ? `${basePrefix}/` : ''
    logCaseAssetDebug('Case asset listing prefix:', normalizedPrefix || '(root)')
    return {
      origin: parsed.origin,
      basePrefix: normalizedPrefix,
    }
  } catch (error) {
    logCaseAssetDebug('Unable to parse case asset base URL for listing', error)
    return null
  }
}

const listingConfig = parseListingConfig()

export const caseAssetListingConfig = listingConfig
export const supportsCaseAssetListing = Boolean(listingConfig)

type ListingUrlOptions = {
  delimiter?: string
  continuationToken?: string
}

const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, '')

export const buildCaseAssetListingUrl = (
  relativePrefix = '',
  options?: ListingUrlOptions,
): string | null => {
  if (!listingConfig) {
    return null
  }
  const relative = stripLeadingSlashes(relativePrefix)
  const prefix = `${listingConfig.basePrefix}${relative}`
  const url = new URL(listingConfig.origin)
  url.searchParams.set('list-type', '2')
  url.searchParams.set('prefix', prefix)
  if (options?.delimiter !== undefined) {
    url.searchParams.set('delimiter', options.delimiter)
  }
  if (options?.continuationToken) {
    url.searchParams.set('continuation-token', options.continuationToken)
  }
  return url.toString()
}

export const stripCaseAssetBasePrefix = (value: string): string => {
  if (!listingConfig?.basePrefix) {
    return value
  }
  if (value.startsWith(listingConfig.basePrefix)) {
    return value.slice(listingConfig.basePrefix.length)
  }
  return value
}
