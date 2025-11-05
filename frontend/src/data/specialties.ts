export type Specialty = {
  id: string
  title: string
  description: string
}

export const specialties: Specialty[] = [
  {
    id: 'hpb-liver',
    title: 'Liver',
    description:
      'Covers hepatic tumors, surgical anatomy, and decision pathways for resection, ablation, and transplantation.',
  },
  {
    id: 'hpb-gallbladder',
    title: 'Gallbladder & Biliary',
    description:
      'Examines gallbladder disease, biliary reconstruction, and cholangiocarcinoma management.',
  },
  {
    id: 'hpb-spleen',
    title: 'Spleen & Portal Hypertension',
    description:
      'Dive into splenic preservation and portal interventions',
  },
  {
    id: 'hpb-pancreas',
    title: 'Pancreas',
    description:
      'Explore pancreatic neoplasms and resection strategies',
  },
]
