import type { CaseAssessment } from '../types/learning'

type LearningAssetDocument = {
  id: string
  title: string
  summary?: string
  content?: string
  contentPath?: string
}

type LearningAssetStructure = {
  id: string
  name: string
  color: string
  meshPath?: string
}

type LearningAssetMetadata = {
  voxels?: string
  spacing?: string
  notes?: string
}

export type LearningAsset = {
  id: string
  specialtyId: string
  title: string
  focus: string
  volumePath?: string
  documents: LearningAssetDocument[]
  structures?: LearningAssetStructure[]
  metadata?: LearningAssetMetadata
  assessment?: CaseAssessment
}

export const learningAssets: LearningAsset[] = [
  {
    id: 'case_d466b655',
    specialtyId: 'hpb-liver',
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
        id: 'doc-clinical-notes',
        title: 'Clinical Consultation Notes',
        summary:
          '63-year-old with chronic hepatitis B cirrhosis evaluated for segment VII lesion; documents history, symptoms, and baseline liver function.',
        contentPath: 'webOutput/case_d466b655/HCC_Patient_Daniel_Huang/Clinical_Notes.pdf',
      },
      {
        id: 'doc-imaging',
        title: 'Imaging Report',
        summary:
          'Triphasic CT describes a 4.2 cm arterially enhancing HCC in segment VII abutting the right hepatic vein without portal invasion.',
        contentPath: 'webOutput/case_d466b655/HCC_Patient_Daniel_Huang/Imaging_Report.pdf',
      },
      {
        id: 'doc-labs',
        title: 'Laboratory Results',
        summary:
          'Shows preserved bilirubin, INR 1.1, albumin 3.8, and platelets 112k consistent with Child-Pugh A reserve.',
        contentPath: 'webOutput/case_d466b655/HCC_Patient_Daniel_Huang/Lab_Results.pdf',
      },
      {
        id: 'doc-treatment',
        title: 'Treatment Plan',
        summary:
          'Outlines parenchymal-sparing resection with vascular control strategy plus adjuvant surveillance milestones.',
        contentPath: 'webOutput/case_d466b655/HCC_Patient_Daniel_Huang/Treatment_Plan.pdf',
      },
    ],
    assessment: {
      title: 'Evaluate Your Understanding',
      intro:
        'Check how the imaging, labs, and operative planning align for this segment VII hepatectomy scenario.',
      questions: [
        {
          id: 'hepatic-vein-course',
          prompt:
            'How does the tumor relate to the right hepatic vein based on the 3D reconstruction?',
          options: [
            {
              id: 'option-displaced',
              label: 'It abuts and displaces the vein without circumferential encasement.',
            },
            {
              id: 'option-encased',
              label: 'It fully encases the vein, requiring venous resection.',
            },
            {
              id: 'option-distant',
              label: 'It is more than 3 cm away, so vascular reconstruction is unnecessary.',
            },
            {
              id: 'option-compresses',
              label: 'It compresses the portal vein bifurcation rather than the hepatic veins.',
            },
          ],
          correctOptionId: 'option-displaced',
          rationale:
            'The tumor closely tracks the right hepatic vein but does not circumferentially encase it, allowing for venous preservation with careful dissection.',
          hint: 'Inspect the venous phase to evaluate how the lesion approaches the right hepatic vein.',
        },
        {
          id: 'arterial-phase-utility',
          prompt: 'Why is the arterial phase critical when reviewing this case?',
          options: [
            {
              id: 'option-margin',
              label: 'It highlights the margin between the lesion and hepatic veins.',
            },
            {
              id: 'option-biliary',
              label: 'It best demonstrates biliary dilation beyond the lesion.',
            },
            {
              id: 'option-parenchyma',
              label: 'It shows background parenchymal fibrosis for staging.',
            },
            {
              id: 'option-labs',
              label: 'It correlates lab trends with functional reserve.',
            },
          ],
          correctOptionId: 'option-margin',
          rationale:
            'Arterial phase imaging defines arterialized tumor margins and vascular relationships that guide resection lines.',
          hint: 'Focus on which sequence clarifies vessel-to-tumor relationships.',
        },
        {
          id: 'preop-labs',
          prompt: 'What do the laboratory findings imply regarding hepatic reserve?',
          options: [
            {
              id: 'option-child',
              label: 'Child-Pugh A status indicates sufficient reserve for segmental resection.',
            },
            {
              id: 'option-insufficient',
              label: 'Synthetic dysfunction makes the patient a poor surgical candidate.',
            },
            {
              id: 'option-portal',
              label: 'Evidence of portal hypertension requires transplant evaluation.',
            },
            {
              id: 'option-unknown',
              label: 'Laboratory data are inconclusive without biopsy confirmation.',
            },
          ],
          correctOptionId: 'option-child',
          rationale:
            'The labs confirm Child-Pugh A status, supporting the ability to tolerate a segment VII resection.',
          hint: 'Consider how a Child-Pugh A profile influences operative planning.',
        },
      ],
    },
  },
  {
    id: 'case_gallbladder_strategy',
    specialtyId: 'hpb-gallbladder',
    title: 'Calot’s Triangle Risk Assessment',
    focus: 'Anticipating critical view exposure challenges',
    documents: [
      {
        id: 'doc-ultrasound',
        title: 'Right Upper Quadrant Ultrasound',
        summary:
          'Thickened gallbladder wall with pericholecystic fluid; cystic duct not well visualised.',
      },
      {
        id: 'doc-operative-plan',
        title: 'Operative Planning Notes',
        summary:
          'Plan for potential subtotal cholecystectomy and intraoperative cholangiogram if inflammation obscures anatomy.',
      },
    ],
    metadata: {
      notes:
        'Pair cross-sectional imaging with intraoperative decision algorithms to maintain the critical view of safety.',
    },
  },
  {
    id: 'case_portal_pressure',
    specialtyId: 'hpb-spleen',
    title: 'Portal Hypertension Optimization',
    focus: 'Stratifying bleeding risk ahead of TIPS consideration',
    documents: [
      {
        id: 'doc-endoscopy',
        title: 'Endoscopy Summary',
        summary: 'Large varices banded; follow-up planned to reassess gastric variceal burden.',
      },
      {
        id: 'doc-hemodynamics',
        title: 'Hepatic Venous Pressure Measurements',
        summary:
          'HVPG of 14 mmHg; patient maintains adequate renal function and platelet count pre-procedure.',
      },
    ],
    metadata: {
      notes:
        'Use splenic volume and collateral mapping to inform multidisciplinary planning for portal decompression.',
    },
  },
  {
    id: 'case_pancreas_pathway',
    specialtyId: 'hpb-pancreas',
    title: 'Pancreatic Head Mass Workup',
    focus: 'Coordinating resection candidacy vs. neoadjuvant therapy',
    documents: [
      {
        id: 'doc-imaging',
        title: 'Pancreatic Protocol CT',
        summary:
          'Hypo-enhancing 2.8 cm lesion abutting the superior mesenteric vein without arterial encasement.',
      },
      {
        id: 'doc-tumor-board',
        title: 'Tumor Board Highlights',
        summary:
          'Recommend neoadjuvant FOLFIRINOX with interval restaging to confirm resectability margins.',
      },
      {
        id: 'doc-navigation',
        title: 'Care Coordination Checklist',
        summary:
          'Align surgical, oncology, and nutrition follow-up to monitor weight loss and glycemic control.',
      },
    ],
    metadata: {
      notes:
        'Leverage vessel involvement scoring and CA 19-9 trends to guide sequencing of systemic therapy and surgery.',
    },
  },
]
