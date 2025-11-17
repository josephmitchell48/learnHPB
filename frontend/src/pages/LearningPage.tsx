import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Specialty } from '../data/specialties'
import { specialties } from '../data/specialties'
import { learningAssets, type LearningAsset } from '../data/learningContent'
import DicomViewer from '../components/dicom/DicomViewer'
import CaseSidebar from '../components/learning/CaseSidebar'
import DocumentViewer from '../components/learning/DocumentViewer'
import AssessmentModule from '../components/learning/AssessmentModule'
import SettingsModal from '../components/modals/SettingsModal'
import type { CaseStudy } from '../types/learning'
import { isLightweightMode } from '../config/environment'
import { resolveCaseAssetUrl, supportsCaseAssetListing } from '../config/assets'
import { useRemoteCaseStudies } from '../hooks/useRemoteCaseStudies'
import { useTheme } from '../context/ThemeContext'
import './LearningPage.css'

type LearnerState = {
  role?: string
  specialty?: Specialty
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
  const isLiverSpecialty = !activeSpecialty || activeSpecialty.id === 'hpb-liver'
  const remoteCasesEnabled = supportsCaseAssetListing && isLiverSpecialty
  const {
    caseStudies: remoteCaseStudies,
    loading: remoteCasesLoading,
    error: remoteCasesError,
  } = useRemoteCaseStudies(remoteCasesEnabled)

  const fallbackCaseStudies = useMemo<CaseStudy[]>(() => {
    const topic = activeSpecialty?.title ?? 'HPB'

    const matchingAssets = learningAssets.filter((asset) => {
      if (activeSpecialty) {
        return asset.specialtyId === activeSpecialty.id
      }
      return asset.specialtyId === 'hpb-liver'
    })

    let assetsToUse = matchingAssets

    if (assetsToUse.length === 0 && activeSpecialty) {
      const placeholderAsset: LearningAsset = {
        id: `placeholder-${activeSpecialty.id}`,
        specialtyId: activeSpecialty.id,
        title: `${activeSpecialty.title} Learning Overview`,
        focus:
          activeSpecialty.description ??
          `Preview the upcoming ${activeSpecialty.title} learning pathway.`,
        documents: [
          {
            id: `doc-${activeSpecialty.id}-highlights`,
            title: `${activeSpecialty.title} Highlights`,
            summary:
              activeSpecialty.description ??
              'Content coming soon. Capture cases and imaging as they are curated.',
          },
          {
            id: `doc-${activeSpecialty.id}-planning`,
            title: 'Planning Notes',
            summary:
              'Outline the cases and imaging resources you plan to add for this specialty.',
          },
        ],
        structures: [],
        metadata: {
          notes:
            'Content coming soon. Use this space to map out your learning objectives and reference materials.',
        },
      }
      assetsToUse = [placeholderAsset]
    } else if (assetsToUse.length === 0) {
      const placeholderAsset: LearningAsset = {
        id: 'placeholder-general',
        specialtyId: 'general',
        title: 'HPB Orientation',
        focus: 'Interface walkthrough',
        documents: [
          {
            id: 'doc-general-overview',
            title: 'Overview',
            summary:
              'Explore the LearnHPB interface while we finalise specialty-specific content.',
          },
          {
            id: 'doc-general-checklist',
            title: 'Iteration Checklist',
            summary:
              'Confirm navigation flows, assess documentation panels, and capture feedback for the team.',
          },
        ],
        structures: [],
        metadata: {
          notes:
            'Placeholder content. Populate learning assets via the data files when ready.',
        },
      }
      assetsToUse = [placeholderAsset]
    }

    return assetsToUse.map((asset, index) => {
      const isPlaceholder = asset.id.startsWith('placeholder-')
      const label = isPlaceholder
        ? `${topic} Learning Overview`
        : `${topic} Case ${index + 1}: ${asset.title}`

      const structures = (asset.structures ?? []).map(({ meshPath, ...structure }) => ({
        ...structure,
        meshUrl: resolveCaseAssetUrl(meshPath),
      }))

      const baseMetadata = asset.metadata ?? {}
      const notes = !imagingEnabled
        ? [
            baseMetadata.notes,
            'Lightweight mode active: imaging data omitted so you can iterate on UI without large asset downloads.',
          ]
            .filter(Boolean)
            .join(' ')
        : baseMetadata.notes

      const metadata = {
        ...baseMetadata,
        ...(notes ? { notes } : {}),
      }

      const volumeUrl = resolveCaseAssetUrl(asset.volumePath)

      return {
        id: asset.id,
        label,
        focus: asset.focus,
        volume:
          imagingEnabled && volumeUrl
            ? {
                url: volumeUrl,
                format: 'vti' as const,
              }
            : undefined,
        metadata,
        documents: asset.documents,
        structures,
        assessment: asset.assessment,
      }
    })
  }, [activeSpecialty, imagingEnabled])

  const caseStudies = useMemo<CaseStudy[]>(() => {
    if (remoteCasesEnabled && remoteCaseStudies.length > 0) {
      return remoteCaseStudies
    }
    return fallbackCaseStudies
  }, [fallbackCaseStudies, remoteCaseStudies, remoteCasesEnabled])

  const showRemoteLoadingBanner =
    remoteCasesEnabled && remoteCasesLoading && remoteCaseStudies.length === 0
  const remoteErrorBanner =
    remoteCasesEnabled && remoteCasesError && remoteCaseStudies.length === 0
      ? remoteCasesError
      : null

  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(caseStudies[0]?.id)
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
    if (caseStudies.length === 0) {
      setSelectedCaseId(undefined)
      setSelectedDocumentId(null)
      return
    }

    const exists = caseStudies.some((caseStudy) => caseStudy.id === selectedCaseId)
    if (!exists) {
      const fallbackCase = caseStudies[0]
      setSelectedCaseId(fallbackCase.id)
      setSelectedDocumentId(fallbackCase.documents[0]?.id ?? null)
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
        {showRemoteLoadingBanner && (
          <div className="case-alert case-alert--info">Loading cases from S3…</div>
        )}
        {remoteErrorBanner && (
          <div className="case-alert case-alert--warning">
            Unable to load remote cases. Showing local sample instead. ({remoteErrorBanner})
          </div>
        )}
        <header className="case-header">
          <div>
            <h1>{selectedCase?.label ?? 'Case Study'}</h1>
            <h2>Clinical Work Up</h2>
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
          <h2>Radiology</h2>
          <p className="dicom-section__subtitle">
            {imagingEnabled ? ''
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

        <AssessmentModule
          caseId={selectedCase?.id}
          assessment={selectedCase?.assessment}
        />
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
