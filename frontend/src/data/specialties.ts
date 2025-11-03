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
      'Focus on hepatic tumors, resections, and transplant readiness in HPB practice.',
  },
  {
    id: 'hpb-gallbladder',
    title: 'Gallbladder & Biliary',
    description:
      'Review cholecystectomy pathways, biliary reconstructions, and cholangiocarcinoma care.',
  },
  {
    id: 'hpb-spleen',
    title: 'Spleen & Portal Hypertension',
    description:
      'Dive into splenic preservation, portal interventions, and variceal management.',
  },
  {
    id: 'hpb-pancreas',
    title: 'Pancreas',
    description:
      'Explore pancreatic neoplasms, resection strategies, and post-operative care coordination.',
  },
]
