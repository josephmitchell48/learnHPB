import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Specialty } from '../data/specialties'
import { specialties } from '../data/specialties'
import './LearningPage.css'

type LearnerState = {
  role?: string
  specialty?: Specialty
}

type CaseDocument = {
  id: string
  title: string
  summary: string
}

type CaseStudy = {
  id: string
  label: string
  focus: string
  documents: CaseDocument[]
}

const placeholderText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent porttitor congue erat,
non commodo magna porta quis. Sed porta volutpat elit, nec iaculis mauris blandit nec. Morbi vitae
venenatis felis. Suspendisse potenti. Sed malesuada lorem id aliquam lacinia. Pellentesque sit amet
felis a nisl feugiat tempus. Donec pulvinar volutpat nunc, sed gravida massa accumsan et. Fusce at
libero eu augue aliquet hendrerit. Integer euismod, ligula non imperdiet semper, neque erat iaculis
metus, ac aliquet risus nibh vitae augue. Nulla facilisi. Quisque dignissim consequat nisi, vitae
tempor ante vulputate ac.`

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

  const caseStudies = useMemo<CaseStudy[]>(() => {
    const topic = activeSpecialty?.title ?? 'Clinical'
    return [
      {
        id: 'case-1',
        label: `${topic} Case 1`,
        focus: 'Acute presentation',
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
  }, [activeSpecialty])

  const [selectedCaseId, setSelectedCaseId] = useState(caseStudies[0]?.id)
  const selectedCase =
    caseStudies.find((caseStudy) => caseStudy.id === selectedCaseId) ??
    caseStudies[0]

  const [selectedDocumentId, setSelectedDocumentId] = useState(
    selectedCase?.documents[0]?.id,
  )
  const selectedDocument =
    selectedCase?.documents.find((doc) => doc.id === selectedDocumentId) ??
    selectedCase?.documents[0]

  useEffect(() => {
    if (selectedCase && selectedDocumentId) {
      const stillExists = selectedCase.documents.some(
        (doc) => doc.id === selectedDocumentId,
      )
      if (!stillExists) {
        setSelectedDocumentId(selectedCase.documents[0]?.id)
      }
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
      <aside className="learning-sidebar">
        <div className="sidebar-specialty">
          <button className="sidebar-back" onClick={goBackToSpecialties}>
            ← Specialties
          </button>
          <h2>{activeSpecialty?.title ?? 'Learning Pathway'}</h2>
          <p>{roleLabel ? `${roleLabel} View` : 'Personalized Journey'}</p>
        </div>

        <nav className="case-list">
          <h3>Patient List</h3>
          <ul>
            {caseStudies.map((caseStudy) => (
              <li key={caseStudy.id}>
                <button
                  type="button"
                  className={
                    caseStudy.id === selectedCaseId
                      ? 'case-item active'
                      : 'case-item'
                  }
                  onClick={() => {
                    setSelectedCaseId(caseStudy.id)
                    setSelectedDocumentId(caseStudy.documents[0]?.id)
                  }}
                >
                  {caseStudy.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link">
            ⚙ App settings
          </button>
          <button type="button" className="sidebar-link">
            ⏻ Sign out
          </button>
        </div>
      </aside>

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

        <div className="case-body">
          <div className="document-list">
            <h2>Document List</h2>
            <ul>
              {selectedCase?.documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    className={
                      doc.id === selectedDocumentId
                        ? 'document-item active'
                        : 'document-item'
                    }
                    onClick={() => setSelectedDocumentId(doc.id)}
                  >
                    <strong>{doc.title}</strong>
                    <span>{doc.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="document-viewer">
            <div className="viewer-toolbar">
              <span className="viewer-title">
                {selectedDocument?.title ?? 'Learning Document'}
              </span>
              <div className="viewer-actions">
                <button type="button">⟲</button>
                <button type="button">⤢</button>
                <button type="button">⬇</button>
              </div>
            </div>
            <div className="viewer-content">
              <p>{placeholderText}</p>
              <p>{placeholderText}</p>
              <p>{placeholderText}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LearningPage
