export type ViewerStructure = {
  id: string
  name: string
  color: string
  meshUrl?: string
}

export type ViewerMetadata = {
  voxels?: string
  spacing?: string
  notes?: string
}

export type ViewerVolume = {
  url: string
  format?: 'vti'
}

export type SliceAxis = 'i' | 'j' | 'k'

export type SliceRange = Record<SliceAxis, [number, number]>

export type SliceState = Record<SliceAxis, number>
