import { resolveCaseAssetUrl, logCaseAssetDebug, buildCaseAssetListingUrl, stripCaseAssetBasePrefix, supportsCaseAssetListing } from '../config/assets'
import type { CaseDocument, CaseStudy } from '../types/learning'

type S3ListPage = {
  prefixes: string[]
  objects: string[]
  isTruncated: boolean
  nextContinuationToken?: string
}

const colorPalette = ['#f94144', '#277da1', '#f9c74f', '#90be6d', '#577590', '#f3722c', '#4d908e']

const formatTitleCase = (value: string) =>
  value
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const stripCasePrefix = (key: string, caseKey: string) => {
  const normalizedCase = caseKey.replace(/\/+$/, '')
  const prefix = `${normalizedCase}/`
  return key.startsWith(prefix) ? key.slice(prefix.length) : key
}

const joinCasePath = (caseKey: string, relative: string) => {
  const normalizedCase = caseKey.replace(/\/+$/, '')
  const normalizedRelative = relative.replace(/^\/+/, '')
  return `${normalizedCase}/${normalizedRelative}`
}

const parseS3ListResponse = (xml: string): S3ListPage => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const parserError = doc.getElementsByTagName('parsererror')[0]
  if (parserError) {
    throw new Error(parserError.textContent ?? 'Malformed S3 listing response')
  }

  const prefixNodes = Array.from(doc.getElementsByTagName('CommonPrefixes'))
  const prefixes = prefixNodes
    .map((node) => node.getElementsByTagName('Prefix')[0]?.textContent ?? '')
    .filter(Boolean)
    .map(stripCaseAssetBasePrefix)
  const contentNodes = Array.from(doc.getElementsByTagName('Contents'))
  const objects = contentNodes
    .map((node) => node.getElementsByTagName('Key')[0]?.textContent ?? '')
    .filter(Boolean)
    .map(stripCaseAssetBasePrefix)

  const isTruncated =
    (doc.getElementsByTagName('IsTruncated')[0]?.textContent ?? '').toLowerCase() === 'true'
  const nextContinuationToken =
    doc.getElementsByTagName('NextContinuationToken')[0]?.textContent ?? undefined

  return {
    prefixes,
    objects,
    isTruncated,
    nextContinuationToken,
  }
}

const fetchListing = async (
  relativePrefix: string,
  delimiter?: string,
): Promise<{ prefixes: string[]; objects: string[] }> => {
  if (!supportsCaseAssetListing) {
    return { prefixes: [], objects: [] }
  }

  let continuationToken: string | undefined
  const allPrefixes: string[] = []
  const allObjects: string[] = []

  do {
    const url = buildCaseAssetListingUrl(relativePrefix, { delimiter, continuationToken })
    if (!url) {
      break
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`S3 listing failed with status ${response.status}`)
    }
    const xml = await response.text()
    const page = parseS3ListResponse(xml)
    allPrefixes.push(...page.prefixes)
    allObjects.push(...page.objects)
    continuationToken = page.isTruncated ? page.nextContinuationToken : undefined
  } while (continuationToken)

  return { prefixes: allPrefixes, objects: allObjects }
}

const listCaseFolders = async (): Promise<string[]> => {
  const { prefixes } = await fetchListing('', '/')
  return prefixes
    .map((prefix) => prefix.replace(/\/+$/, ''))
    .filter(Boolean)
    .sort()
}

const listCaseObjects = async (caseKey: string): Promise<string[]> => {
  const { objects } = await fetchListing(`${caseKey}/`)
  return objects.map((key) => stripCasePrefix(key, caseKey)).filter(Boolean)
}

type RemoteCaseManifest = {
  case_id?: string
  title?: string
  focus?: string
  metadata?: { notes?: string; voxels?: string; spacing?: string }
  volume?:
    | string
    | {
        output?: string
      }
  meshes?: Record<string, string>
  segmentations?: Array<{ output?: string; display_name?: string }>
  documents?: Array<{ title?: string; filename?: string; summary?: string }>
  request_id?: string
  timestamp?: number
}

const fetchCaseManifest = async (caseKey: string): Promise<RemoteCaseManifest | null> => {
  const candidateFiles = ['manifest.json', 'metadata.json']
  for (const filename of candidateFiles) {
    const manifestPath = joinCasePath(caseKey, filename)
    const manifestUrl = resolveCaseAssetUrl(manifestPath)
    if (!manifestUrl) {
      continue
    }
    try {
      const response = await fetch(manifestUrl, { cache: 'no-cache' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      logCaseAssetDebug('Loaded manifest for', caseKey, 'from', filename)
      return (await response.json()) as RemoteCaseManifest
    } catch (error) {
      logCaseAssetDebug('Manifest fetch failed for', caseKey, filename, error)
    }
  }
  return null
}

const chooseVolumePath = (
  caseKey: string,
  manifest: RemoteCaseManifest | null,
  availableFiles: string[],
): string | undefined => {
  const availableSet = new Set(availableFiles.map((file) => file.toLowerCase()))

  const manifestVolume = manifest?.volume
  if (typeof manifestVolume === 'string' && manifestVolume.trim()) {
    const candidate = manifestVolume.trim().replace(/^\/+/, '')
    if (availableSet.has(candidate.toLowerCase())) {
      return joinCasePath(caseKey, candidate)
    }
  } else if (manifestVolume && typeof manifestVolume === 'object') {
    const output = manifestVolume.output?.trim()
    if (output) {
      const normalized = output.replace(/^\/+/, '')
      if (availableSet.has(normalized.toLowerCase())) {
        return joinCasePath(caseKey, normalized)
      }
    }
  }

  const fallback =
    availableFiles.find((file) => file.toLowerCase().endsWith('_volume.vti')) ??
    availableFiles.find((file) => file.toLowerCase().endsWith('.vti'))
  return fallback ? joinCasePath(caseKey, fallback) : undefined
}

const normalizeRelativePath = (value: string) => value.replace(/^\/+/, '')

const createStructureNameLookup = (manifest: RemoteCaseManifest | null) => {
  const entries: Array<[string, string]> = []
  if (manifest?.meshes) {
    Object.entries(manifest.meshes).forEach(([label, path]) => {
      if (typeof path === 'string') {
        entries.push([normalizeRelativePath(path), label])
      }
    })
  }
  if (manifest?.segmentations) {
    manifest.segmentations.forEach((segmentation) => {
      if (segmentation.output) {
        entries.push([
          normalizeRelativePath(segmentation.output),
          segmentation.display_name ?? segmentation.output,
        ])
      }
    })
  }
  return new Map(entries)
}

const buildStructures = (
  caseKey: string,
  meshFiles: string[],
  manifest: RemoteCaseManifest | null,
) => {
  const lookup = createStructureNameLookup(manifest)
  return meshFiles.map((relativePath, index) => {
    const color = colorPalette[index % colorPalette.length]
    const fileName = relativePath.split('/').pop() ?? relativePath
    const normalized = normalizeRelativePath(relativePath)
    const nameFromManifest =
      lookup.get(normalized) ?? lookup.get(fileName) ?? null
    const friendlyName = nameFromManifest
      ? formatTitleCase(nameFromManifest)
      : formatTitleCase(fileName)
    const meshPath = joinCasePath(caseKey, relativePath)
    return {
      id: `${caseKey}-${fileName}`.replace(/[^\w-]+/g, '-'),
      name: friendlyName,
      color,
      meshUrl: resolveCaseAssetUrl(meshPath),
    }
  })
}

const buildDocuments = (
  caseKey: string,
  documentFiles: string[],
  manifest: RemoteCaseManifest | null,
): CaseDocument[] => {
  const manifestDocs = manifest?.documents ?? []
  const docsByFilename = new Map(
    manifestDocs
      .filter((doc) => doc.filename)
      .map((doc) => [normalizeRelativePath(doc.filename!), doc]),
  )

  return documentFiles.map((relativePath) => {
    const normalized = normalizeRelativePath(relativePath)
    const fileName = normalized.split('/').pop() ?? normalized
    const manifestDoc = docsByFilename.get(normalized) ?? docsByFilename.get(fileName)
    const title = manifestDoc?.title ?? formatTitleCase(fileName)
    const summary = manifestDoc?.summary ?? `Document imported from ${formatTitleCase(fileName)}`
    return {
      id: `${caseKey}-${fileName}`.replace(/[^\w-]+/g, '-'),
      title,
      summary,
      contentPath: joinCasePath(caseKey, normalized),
    }
  })
}

const createPlaceholderDocument = (caseKey: string): CaseDocument[] => [
  {
    id: `${caseKey}-placeholder-doc`,
    title: 'Case Notes',
    summary: 'No clinical documents were found for this case. Upload PDFs under clinical_files/.',
    content: 'This case does not have any associated documents yet.',
  },
]

const buildMetadataNotes = (
  manifest: RemoteCaseManifest | null,
  documentCount: number,
  structureCount: number,
) => {
  const notes: string[] = []
  if (manifest?.request_id) {
    notes.push(`Request ${manifest.request_id}`)
  }
  if (manifest?.timestamp) {
    const date = new Date(manifest.timestamp * 1000)
    notes.push(`Processed ${date.toLocaleString()}`)
  }
  notes.push(
    `Includes ${documentCount} document${documentCount === 1 ? '' : 's'} and ${structureCount} structure${structureCount === 1 ? '' : 's'}.`,
  )
  if (manifest?.metadata?.notes) {
    notes.push(manifest.metadata.notes)
  }
  return notes.join(' ')
}

const buildCaseStudy = async (caseKey: string): Promise<CaseStudy | null> => {
  try {
    const [objects, manifest] = await Promise.all([
      listCaseObjects(caseKey),
      fetchCaseManifest(caseKey),
    ])

    const docFiles = objects.filter(
      (file) =>
        file.startsWith('clinical_files/') && file.toLowerCase().endsWith('.pdf'),
    )
    const meshFiles = objects.filter(
      (file) =>
        file.startsWith('segmentations/') && file.toLowerCase().endsWith('.vtp'),
    )
    logCaseAssetDebug('Case', caseKey, 'segmentations found:', meshFiles)
    const volumeCandidates = objects.filter((file) => file.toLowerCase().endsWith('.vti'))

    const caseId = manifest?.case_id ?? caseKey
    const label = manifest?.title ?? formatTitleCase(caseId)
    const focus = manifest?.focus ?? 'HPB imaging review'
    const documents =
      docFiles.length > 0 ? buildDocuments(caseKey, docFiles, manifest) : createPlaceholderDocument(caseKey)
    const structures = buildStructures(caseKey, meshFiles, manifest)
    logCaseAssetDebug(
      'Case',
      caseKey,
      'structures built:',
      structures.map((structure) => ({
        id: structure.id,
        meshUrl: structure.meshUrl,
        color: structure.color,
      })),
    )
    const volumePath = chooseVolumePath(caseKey, manifest, volumeCandidates)

    const metadata = {
      voxels: manifest?.metadata?.voxels,
      spacing: manifest?.metadata?.spacing,
      notes: buildMetadataNotes(manifest, documents.length, structures.length),
    }

    const volumeUrl = volumePath ? resolveCaseAssetUrl(volumePath) : undefined

    return {
      id: caseId,
      label,
      focus,
      volume: volumeUrl
        ? {
            url: volumeUrl,
            format: 'vti',
          }
        : undefined,
      documents,
      structures,
      metadata,
    }
  } catch (error) {
    logCaseAssetDebug('Failed to load case', caseKey, error)
    return null
  }
}

export const loadRemoteCaseStudies = async (): Promise<CaseStudy[]> => {
  if (!supportsCaseAssetListing) {
    return []
  }
  const caseFolders = await listCaseFolders()
  const cases = await Promise.all(caseFolders.map((folder) => buildCaseStudy(folder)))
  return cases.filter((caseStudy): caseStudy is CaseStudy => Boolean(caseStudy))
}
