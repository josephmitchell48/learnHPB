import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Specialty } from '../data/specialties'
import { specialties } from '../data/specialties'
import DicomViewer from '../components/dicom/DicomViewer'
import CaseSidebar from '../components/learning/CaseSidebar'
import DocumentViewer from '../components/learning/DocumentViewer'
import type { CaseStudy } from '../types/learning'
import { isLightweightMode } from '../config/environment'
import './LearningPage.css'

type LearnerState = {
  role?: string
  specialty?: Specialty
}

const dataRoot = `${import.meta.env.BASE_URL}webOutput`

const hpbCaseAssets = [
  {
    id: 'case_d466b655',
    title: 'Segment VII Hepatectomy Planning',
    focus: 'HCC near the right hepatic vein',
    volumePath: 'case_d466b655/case_d466b655_volume.vti',
    structures: [
      {
        id: 'structure-liver',
        name: 'Liver Parenchyma',
        color: '#f8b195',
        meshPath: 'case_d466b655/segmentations/case_d466b655_liver.vtp',
      },
      {
        id: 'structure-vessels',
        name: 'Hepatic Vessels',
        color: '#355c7d',
        meshPath: 'case_d466b655/segmentations/case_d466b655_hepatic_vessels.vtp',
      },
      {
        id: 'structure-lesions',
        name: 'Liver Tumors',
        color: '#6c5b7b',
        meshPath: 'case_d466b655/segmentations/case_d466b655_liver_tumors.vtp',
      },
    ],
    metadata: {
      voxels: '512 × 512 × 320',
      spacing: '0.75 mm × 0.75 mm × 1.0 mm',
      notes: 'Synthetic HPB dataset highlighting vascular-tumor relationships.',
    },
    documents: [
      {
        id: 'doc-radiology',
        title: 'Triphasic CT Report',
        summary: 'Arterial enhancement with portal venous washout; margin assessment for resection.',
      },
      {
        id: 'doc-board',
        title: 'Tumor Board Notes',
        summary: 'Consensus plan for segment VII resection with vascular reconstruction.',
      },
      {
        id: 'doc-labs',
        title: 'Preoperative Labs',
        summary: 'Child-Pugh A profile with adequate liver reserve.',
      },
    ],
  },
]

const LearningPage = () => {
  const navigate = useNavigate()
  const { specialtyId } = useParams<{ specialtyId: string }>()
  const location = useLocation()
  const { role, specialty } = (location.state as LearnerState) ?? {}
  const normalizedRole = role?.toLowerCase()
  const roleLabel = normalizedRole
    ? normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
    : undefined

  const activeSpecialty =
    specialty ?? specialties.find((item) => item.id === specialtyId)
  const imagingEnabled = !isLightweightMode

  const caseStudies = useMemo<CaseStudy[]>(() => {
    const topic = activeSpecialty?.title ?? 'HPB'

    if (!imagingEnabled) {
      return [
        {
          id: 'case-lightweight',
          label: `${topic} UX Focus`,
          focus: 'Interface walkthrough',
          documents: [
            {
              id: 'doc-ux-overview',
              title: 'Scenario Overview',
              summary:
                'High-level patient context for UI review. Imaging loads are disabled to prioritise layout tweaks.',
            },
            {
              id: 'doc-checklist',
              title: 'Interaction Checklist',
              summary: 'Track UI flows, ensure navigation clarity, and update notes inline.',
            },
          ],
          structures: [],
          metadata: {
            notes:
              'Lightweight mode active: imaging data omitted so you can iterate on UI without large asset downloads.',
          },
        },
      ]
    }

    return hpbCaseAssets
      .filter((asset) => asset.id.startsWith('case'))
      .map((asset, index) => ({
        id: asset.id,
        label: `${topic} Case ${index + 1}: ${asset.title}`,
        focus: asset.focus,
        volume: {
          url: `${dataRoot}/${asset.volumePath}`,
          format: 'vti',
        },
        metadata: asset.metadata,
        documents: asset.documents,
        structures: asset.structures.map(({ meshPath, ...structure }) => ({
          ...structure,
          meshUrl: `${dataRoot}/${meshPath}`,
        })),
      }))
  }, [activeSpecialty, imagingEnabled])

  const [selectedCaseId, setSelectedCaseId] = useState(caseStudies[0]?.id)
  const selectedCase =
    caseStudies.find((caseStudy) => caseStudy.id === selectedCaseId) ??
    caseStudies[0]

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    selectedCase?.documents[0]?.id ?? null,
  )

  useEffect(() => {
    if (!selectedCase) {
      return
    }

    const stillExists = selectedCase.documents.some(
      (doc) => doc.id === selectedDocumentId,
    )

    if (!stillExists) {
      setSelectedDocumentId(selectedCase.documents[0]?.id ?? null)
    }
  }, [selectedCase, selectedDocumentId])

  useEffect(() => {
    if (!selectedCaseId && caseStudies[0]) {
      setSelectedCaseId(caseStudies[0].id)
    }
  }, [caseStudies, selectedCaseId])

  const goBackToSpecialties = () => {
    navigate('/specialties', {
      state: { role: normalizedRole ?? 'guest', specialty: activeSpecialty },
    })
  }

  return (
    <div className="learning-layout">
      <CaseSidebar
        activeSpecialtyLabel={activeSpecialty?.title}
        roleLabel={roleLabel}
        caseStudies={caseStudies}
        selectedCaseId={selectedCase?.id}
        onSelectCase={(caseId) => {
          setSelectedCaseId(caseId)
          const nextCase = caseStudies.find((caseStudy) => caseStudy.id === caseId)
          setSelectedDocumentId(nextCase?.documents[0]?.id ?? null)
        }}
        onBack={goBackToSpecialties}
      />

      <section className="learning-main">
        <header className="case-header">
          <div>
            <h1>{selectedCase?.label ?? 'Case Study'}</h1>
            <p className="case-focus">
              Clinical focus:{' '}
              <span>{selectedCase?.focus ?? 'Comprehensive review'}</span>
            </p>
          </div>
          <div className="case-meta">
            <span className="meta-chip">{activeSpecialty?.title}</span>
            {roleLabel && <span className="meta-chip">{roleLabel}</span>}
          </div>
        </header>

        <DocumentViewer
          documents={selectedCase?.documents ?? []}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={(documentId) => setSelectedDocumentId(documentId)}
        />

        <section className="dicom-section">
          <h2>3D Exploration</h2>
          <p className="dicom-section__subtitle">
            {imagingEnabled
              ? 'Interact with vascular and organ structures to reinforce spatial understanding.'
              : 'Imaging is disabled in lightweight mode so you can focus on UI layout and flows.'}
          </p>
          <DicomViewer
            caseLabel={selectedCase?.label ?? 'Case Study'}
            volume={selectedCase?.volume}
            structures={selectedCase?.structures ?? []}
            metadata={selectedCase?.metadata}
            imagingEnabled={imagingEnabled}
            onExportStructure={(structureId) => {
              console.log(
                `Export requested for ${structureId} in case ${selectedCase?.id}`,
              )
            }}
          />
        </section>
      </section>
    </div>
  )
}

export default LearningPage
