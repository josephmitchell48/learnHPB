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
        id: 'doc-referral',
        title: 'Patient Referral',
        summary: 'Primary care summary requesting HPB surgical consultation for a segment VII lesion.',
        format: 'html',
        body: `<section>
  <h4>Referral Overview</h4>
  <p><strong>From:</strong> Dr. Amina Patel, Central Family Medicine<br/>
     <strong>To:</strong> Hepatopancreatobiliary Surgical Service<br/>
     <strong>Date:</strong> 3 February 2025</p>
  <p>Mr. Devon Chambers (DOB: 12 May 1962) was seen in clinic following incidental detection of a 3.2 cm hepatic lesion in segment VII on abdominal ultrasound performed for escalating right flank discomfort. His performance status remains ECOG 1 and he continues to work full-time as an electrician.</p>
  <h5>Relevant Medical History</h5>
  <ul>
    <li><strong>14 Aug 2017:</strong> Laparoscopic cholecystectomy for symptomatic cholelithiasis; recovery uncomplicated.</li>
    <li><strong>22 Jun 2019:</strong> Hepatitis C successfully treated with glecaprevir/pibrentasvir; sustained virologic response documented Dec 2019.</li>
    <li><strong>09 Nov 2023:</strong> Screening colonoscopy — two sigmoid polyps removed, tubular adenomas, 5-year surveillance interval recommended.</li>
    <li><strong>16 Jan 2025:</strong> Triphasic CT demonstrating arterially enhancing lesion with portal venous washout abutting the right hepatic vein.</li>
  </ul>
  <p>Past medical history otherwise includes well-controlled hypertension (lisinopril 10 mg daily) and type 2 diabetes managed with metformin alone. No known drug allergies. Social history notable for 15 pack-year smoking history, quit 2015; alcohol use limited to 1–2 drinks/week.</p>
  <p>Physical examination revealed mild hepatomegaly without tenderness or stigmata of chronic liver disease. No jaundice, ascites, or peripheral edema.</p>
  <p>The patient and family are motivated to pursue curative-intent therapy should he be a candidate. Please arrange an expedited consultation with the HPB surgical specialist to review resection feasibility and coordinate multidisciplinary input.</p>
</section>`,
      },
      {
        id: 'doc-labs',
        title: 'Laboratory Results',
        summary: 'Comprehensive preoperative labs with reference ranges for hepatic optimisation.',
        format: 'html',
        body: `<section>
  <h4>Key Laboratory Findings</h4>
  <table>
    <thead>
      <tr>
        <th>Test</th>
        <th>Result</th>
        <th>Units</th>
        <th>Reference Range</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Hemoglobin</td>
        <td>132</td>
        <td>g/L</td>
        <td>120–160 g/L</td>
      </tr>
      <tr>
        <td>Platelets</td>
        <td>218</td>
        <td>×10<sup>9</sup>/L</td>
        <td>150–400 ×10<sup>9</sup>/L</td>
      </tr>
      <tr>
        <td>INR</td>
        <td>1.0</td>
        <td>ratio</td>
        <td>0.9–1.1</td>
      </tr>
      <tr>
        <td>AST</td>
        <td>32</td>
        <td>U/L</td>
        <td>0–35 U/L</td>
      </tr>
      <tr>
        <td>ALT</td>
        <td>29</td>
        <td>U/L</td>
        <td>0–45 U/L</td>
      </tr>
      <tr>
        <td>Total Bilirubin</td>
        <td>11</td>
        <td>µmol/L</td>
        <td>3–21 µmol/L</td>
      </tr>
      <tr>
        <td>Albumin</td>
        <td>41</td>
        <td>g/L</td>
        <td>35–50 g/L</td>
      </tr>
      <tr>
        <td>Creatinine</td>
        <td>76</td>
        <td>µmol/L</td>
        <td>60–110 µmol/L</td>
      </tr>
      <tr>
        <td>Alpha-fetoprotein</td>
        <td>18</td>
        <td>µg/L</td>
        <td>&lt;10 µg/L</td>
      </tr>
      <tr>
        <td>Child-Pugh Score</td>
        <td>A5</td>
        <td>—</td>
        <td>A5–A6 (compensated)</td>
      </tr>
    </tbody>
  </table>
  <p>Trend review over the past 3 months shows stable transaminases and improving platelet count following eradication of hepatitis C. No features of decompensated cirrhosis identified.</p>
</section>`,
      },
      {
        id: 'doc-procedure',
        title: 'Tentative Procedure Summary',
        summary: 'Planned segment VII hepatectomy with vascular control strategy and perioperative considerations.',
        format: 'html',
        body: `<section>
  <h4>Operative Objective</h4>
  <p>Proceed with an open, parenchyma-sparing resection of segment VII to achieve oncologic clearance while preserving right hepatic venous outflow.</p>
  <h4>Key Steps</h4>
  <ol>
    <li>Mobilise right lobe with preservation of inferior vena cava adhesions; perform intraoperative ultrasound to confirm tumour margins.</li>
    <li>Control inflow via selective clamping of the posterior right portal pedicle; intermittent Pringle manoeuvre on standby.</li>
    <li>Demarcate segment VII and resect using cavitron ultrasonic surgical aspirator with bipolar sealing of small venous branches.</li>
    <li>Reconstruct small tributary of the right hepatic vein if required using 6-0 Prolene patch.</li>
  </ol>
  <h4>Perioperative Plan</h4>
  <ul>
    <li>Haemodynamic monitoring in step-down unit for first 24 hours.</li>
    <li>Enhanced recovery pathway with early mobilisation and liver-friendly analgesia strategy.</li>
    <li>Multidisciplinary discussion with interventional radiology for contingency ablation if margin clearance inadequate.</li>
  </ul>
  <p>Proceed pending final anaesthetic assessment and patient consent after HPB specialist consultation.</p>
</section>`,
      },
      {
        id: 'doc-imaging',
        title: 'Imaging Reports',
        summary: 'Triphasic CT interpretation highlighting hepatic arterial anatomy and tumour relation to vasculature.',
        format: 'html',
        body: `<section>
  <h4>CT Triphasic Liver Study (16 Jan 2025)</h4>
  <p><strong>Technique:</strong> Multi-detector CT of the abdomen with arterial, portal venous, and delayed phases (slice thickness 1 mm). Oral contrast withheld. IV contrast: 120 mL Iohexol 350 at 4 mL/s.</p>
  <h5>Findings</h5>
  <ul>
    <li><strong>Arterial phase:</strong> 3.2 × 2.9 cm hyperenhancing lesion in segment VII with capsule appearance; abuts but does not invade the right hepatic vein.</li>
    <li><strong>Portal venous phase:</strong> Lesion demonstrates classic washout, enhancing rim persists. No additional lesions identified.</li>
    <li><strong>Delayed phase:</strong> Subtle capsule with no biliary dilation. Segmental perfusion of remnant liver preserved.</li>
    <li><strong>Vascular anatomy:</strong> Right hepatic artery arises conventionally. Accessory inferior right hepatic vein patent.</li>
    <li><strong>Lymph nodes:</strong> No pathologic regional lymphadenopathy; porta hepatis nodes &lt;8 mm short axis.</li>
  </ul>
  <h5>Impression</h5>
  <ol>
    <li>LIRADS-5 lesion in segment VII consistent with hepatocellular carcinoma.</li>
    <li>No macrovascular invasion or extrahepatic disease identified.</li>
    <li>Adequate future liver remnant estimated at 62% assuming segment VII resection.</li>
  </ol>
  <p>Please correlate with laboratory data and proceed with HPB surgical evaluation as requested.</p>
</section>`,
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
            body: `This lightweight scenario mirrors the hepatic oncology case flow but removes imaging assets so
designers can iterate quickly.

Key points:
• Landing on this page should reinforce the user’s selected specialty and role.
• Document navigation must work at all viewport sizes without loading volumetric data.
• The sidebar and document pane should remain interactive, allowing reviewers to simulate their
  typical workflow while validating copy, spacing, and responsive states.`
            },
            {
              id: 'doc-checklist',
              title: 'Interaction Checklist',
            summary: 'Track UI flows, ensure navigation clarity, and update notes inline.',
            body: `Use this checklist while reviewing the UI without imaging assets:

1. Confirm the selected role and specialty persist when navigating forward/back.
2. Verify the document list highlights the active item and announces changes for screen readers.
3. Test tab order and keyboard interactions for the document list and viewer controls.
4. Resize the window to ensure the layout degrades gracefully to a single column.
5. Capture feedback on copy tone, spacing, and any accessibility flags before re-enabling imaging.`
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
