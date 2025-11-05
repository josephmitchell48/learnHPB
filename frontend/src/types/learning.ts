import type {
  ViewerMetadata,
  ViewerStructure,
  ViewerVolume,
} from '../components/dicom/types'

export type CaseQuestionOption = {
  id: string
  label: string
}

export type CaseQuestion = {
  id: string
  prompt: string
  options: CaseQuestionOption[]
  correctOptionId: string
  rationale: string
  hint?: string
}

export type CaseAssessment = {
  title: string
  intro: string
  questions: CaseQuestion[]
}

export type CaseDocument = {
  id: string
  title: string
  summary: string
  content?: string
  contentPath?: string
}

export type CaseStudy = {
  id: string
  label: string
  focus: string
  volume?: ViewerVolume
  documents: CaseDocument[]
  structures: ViewerStructure[]
  metadata: ViewerMetadata
  assessment?: CaseAssessment
}
