import type {
  ViewerMetadata,
  ViewerStructure,
  ViewerVolume,
} from '../components/dicom/types'

export type CaseDocument = {
  id: string
  title: string
  summary: string
  format?: 'plain' | 'html'
  body: string
}

export type CaseStudy = {
  id: string
  label: string
  focus: string
  volume?: ViewerVolume
  documents: CaseDocument[]
  structures: ViewerStructure[]
  metadata: ViewerMetadata
}
