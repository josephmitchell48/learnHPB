import type { ViewerMetadata, ViewerStructure } from '../components/dicom/DicomViewer'

export type CaseDocument = {
  id: string
  title: string
  summary: string
}

export type CaseStudy = {
  id: string
  label: string
  focus: string
  documents: CaseDocument[]
  structures: ViewerStructure[]
  metadata: ViewerMetadata
}
