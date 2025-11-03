import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Specialty } from '../data/specialties'
import { specialties } from '../data/specialties'
import DicomViewer from '../components/dicom/DicomViewer'
import CaseSidebar from '../components/learning/CaseSidebar'
import DocumentViewer from '../components/learning/DocumentViewer'
import SettingsModal from '../components/modals/SettingsModal'
import type { CaseStudy } from '../types/learning'
import { isLightweightMode } from '../config/environment'
import { useTheme } from '../context/ThemeContext'
import './LearningPage.css'

type LearnerState = {
  role?: string
  specialty?: Specialty
}

const dataRoot = `${import.meta.env.BASE_URL}webOutput`

const assetCatalog = {
  hepatic002: {
    volume: `${dataRoot}/hepaticvessel_002/hepaticvessel_002_volume.vti`,
    liver: `${dataRoot}/hepaticvessel_002/segmentations/hepaticvessel_002_liver.vtp`,
    vessels: `${dataRoot}/hepaticvessel_002/segmentations/hepaticvessel_002_vsnet.vtp`,
    lesion: `${dataRoot}/hepaticvessel_002/segmentations/hepaticvessel_002_task008.vtp`,
  },
  hepatic008: {
    volume: `${dataRoot}/hepaticvessel_008/hepaticvessel_008_volume.vti`,
    liver: `${dataRoot}/hepaticvessel_008/segmentations/hepaticvessel_008_liver.vtp`,
    vessels: `${dataRoot}/hepaticvessel_008/segmentations/hepaticvessel_008_vsnet.vtp`,
    lesion: `${dataRoot}/hepaticvessel_008/segmentations/hepaticvessel_008_task008.vtp`,
  },
  hepatic010: {
    volume: `${dataRoot}/hepaticvessel_010/hepaticvessel_010_volume.vti`,
    liver: `${dataRoot}/hepaticvessel_010/segmentations/hepaticvessel_010_liver.vtp`,
    vessels: `${dataRoot}/hepaticvessel_010/segmentations/hepaticvessel_010_vsnet.vtp`,
    lesion: `${dataRoot}/hepaticvessel_010/segmentations/hepaticvessel_010_task008.vtp`,
  },
}

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

    return [
      {
        id: 'case-1',
        label: `${topic} Case 1`,
        focus: 'Acute presentation',
        volume: {
          url: assetCatalog.hepatic002.volume,
          format: 'vti',
        },
        metadata: {
          voxels: '512 × 512 × 320',
          spacing: '0.75 mm × 0.75 mm × 1.0 mm',
          notes: 'Initial arterial phase scan capturing primary vascular supply.',
        },
        structures: [
          {
            id: 'structure-liver',
            name: `${topic} Parenchyma`,
            color: '#f8b195',
            meshUrl: assetCatalog.hepatic002.liver,
          },
          {
            id: 'structure-artery',
            name: 'Hepatic Vessels',
            color: '#6c5b7b',
            meshUrl: assetCatalog.hepatic002.vessels,
          },
          {
            id: 'structure-lesion',
            name: 'Index Lesion',
            color: '#355c7d',
            meshUrl: assetCatalog.hepatic002.lesion,
          },
        ],
        documents: [
          {
            id: 'doc-referral',
            title: 'Patient Referral',
            summary: 'Summary of presenting complaint and referring provider notes.',
          },
          {
            id: 'doc-labs',
            title: 'Laboratory Results',
            summary: 'Comprehensive metabolic panel and relevant biomarkers.',
          },
          {
            id: 'doc-imaging',
            title: 'Imaging Report',
            summary: 'Radiology findings with annotations.',
          },
        ],
      },
      {
        id: 'case-2',
        label: `${topic} Case 2`,
        focus: 'Chronic management',
        volume: {
          url: assetCatalog.hepatic008.volume,
          format: 'vti',
        },
        metadata: {
          voxels: '448 × 448 × 280',
          spacing: '0.9 mm × 0.9 mm × 1.5 mm',
          notes: 'Portal venous phase with post-intervention follow-up.',
        },
        structures: [
          {
            id: 'structure-parenchyma',
            name: `${topic} Anatomy`,
            color: '#f67280',
            meshUrl: assetCatalog.hepatic008.liver,
          },
          {
            id: 'structure-portal',
            name: 'Portal System',
            color: '#c06c84',
            meshUrl: assetCatalog.hepatic008.vessels,
          },
          {
            id: 'structure-lesion-2',
            name: 'Treatment Zone',
            color: '#355c7d',
            meshUrl: assetCatalog.hepatic008.lesion,
          },
        ],
        documents: [
          {
            id: 'doc-history',
            title: 'Medical History',
            summary: 'Timeline of clinical encounters and prior interventions.',
          },
          {
            id: 'doc-plan',
            title: 'Care Plan',
            summary: 'Interdisciplinary approach and follow-up schedule.',
          },
        ],
      },
      {
        id: 'case-3',
        label: `${topic} Case 3`,
        focus: 'Post-procedural follow-up',
        volume: {
          url: assetCatalog.hepatic010.volume,
          format: 'vti',
        },
        metadata: {
          voxels: '512 × 512 × 220',
          spacing: '0.8 mm × 0.8 mm × 1.2 mm',
          notes: 'Delayed phase to evaluate post-operative perfusion.',
        },
        structures: [
          {
            id: 'structure-organ',
            name: `${topic} Volume`,
            color: '#f8b195',
            meshUrl: assetCatalog.hepatic010.liver,
          },
          {
            id: 'structure-vein',
            name: 'Venous Drainage',
            color: '#355c7d',
            meshUrl: assetCatalog.hepatic010.vessels,
          },
          {
            id: 'structure-tumor',
            name: 'Residual Lesion',
            color: '#6c5b7b',
            meshUrl: assetCatalog.hepatic010.lesion,
          },
        ],
        documents: [
          {
            id: 'doc-summary',
            title: 'Procedure Summary',
            summary: 'Operating room report and intraoperative decisions.',
          },
          {
            id: 'doc-progress',
            title: 'Progress Notes',
            summary: 'Inpatient course and discharge considerations.',
          },
        ],
      },
    ]
  }, [activeSpecialty, imagingEnabled])

  const [selectedCaseId, setSelectedCaseId] = useState(caseStudies[0]?.id)
  const selectedCase =
    caseStudies.find((caseStudy) => caseStudy.id === selectedCaseId) ??
    caseStudies[0]

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    selectedCase?.documents[0]?.id ?? null,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { preference: themePreference, setPreference: setThemePreference, theme } = useTheme()
  const [shareProfile, setShareProfile] = useState(true)
  const [showEmail, setShowEmail] = useState(true)

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

  const goToSignIn = () => {
    navigate('/', { replace: true })
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
        onSignOut={goToSignIn}
        onOpenSettings={() => setSettingsOpen(true)}
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

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        variant={theme === 'dark' ? 'dark' : 'light'}
      >
        <section className="settings-section">
          <h3>Display</h3>
          <p>Adjust how visuals appear across LearnHPB.</p>
          <div className="settings-subgrid">
            <div className="settings-control">
              <label htmlFor="settings-theme">Theme preference</label>
              <select
                id="settings-theme"
                value={themePreference}
                onChange={(event) =>
                  setThemePreference(event.target.value as 'system' | 'light' | 'dark')
                }
              >
                <option value="system">Match system</option>
                <option value="light">Light mode</option>
                <option value="dark">Dark mode</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>Profile</h3>
          <p>Control what faculty and collaborators can see.</p>
          <div className="settings-options">
            <div className="settings-toggle">
              <label htmlFor="settings-share-profile">
                Share profile with faculty
                <span>Allow educators to see your role, specialty, and progress.</span>
              </label>
              <input
                id="settings-share-profile"
                type="checkbox"
                checked={shareProfile}
                onChange={(event) => setShareProfile(event.target.checked)}
              />
            </div>
            <div className="settings-toggle">
              <label htmlFor="settings-show-email">
                Display contact email
                <span>Include your email in shared case notes for coordination.</span>
              </label>
              <input
                id="settings-show-email"
                type="checkbox"
                checked={showEmail}
                onChange={(event) => setShowEmail(event.target.checked)}
              />
            </div>
          </div>
        </section>

      </SettingsModal>
    </div>
  )
}

export default LearningPage
