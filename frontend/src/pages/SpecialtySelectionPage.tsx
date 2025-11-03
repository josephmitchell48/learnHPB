import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { specialties } from '../data/specialties'
import type { Specialty } from '../data/specialties'

type LocationState = {
  role?: string
  email?: string
  provider?: string
  specialty?: Specialty
}

const SpecialtySelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, specialty: incomingSpecialty } =
    (location.state as LocationState) ?? {}
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(
    () =>
      incomingSpecialty
        ? specialties.find((item) => item.id === incomingSpecialty.id) ?? null
        : null,
  )

  const capitalizedRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : null
  const roleArticle =
    capitalizedRole && /^[aeiou]/i.test(capitalizedRole) ? 'an' : 'a'

  return (
    <div className="page-layout">
      <div className="panel">
        <h2 className="panel-title">Select an HPB focus area</h2>
        <p className="panel-subtitle">
          {capitalizedRole
            ? `Let’s get started with hepatopancreatobiliary resources tailored for ${capitalizedRole}s.`
            : 'Choose a hepatopancreatobiliary sub-specialty to preview tailored cases and imaging.'}
        </p>

        <div className="card-grid">
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              className={`card-button ${
                selectedSpecialty?.id === specialty.id ? 'active' : ''
              }`}
              type="button"
              onClick={() => setSelectedSpecialty(specialty)}
            >
              <h3>{specialty.title}</h3>
              <p>{specialty.description}</p>
            </button>
          ))}
        </div>

        {selectedSpecialty && (
          <div className="selection-summary">
            <h3>{selectedSpecialty.title}</h3>
            <p>
              {role
                ? `Preparing ${roleArticle} ${capitalizedRole} learning pathway for the ${selectedSpecialty.title} service.`
                : `Great choice! We will tailor HPB content for the ${selectedSpecialty.title} focus area.`}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                navigate(`/learning/${selectedSpecialty.id}`, {
                  state: { role: role ?? 'guest', specialty: selectedSpecialty },
                })
              }
            >
              Continue with {selectedSpecialty.title}
            </button>
          </div>
        )}

        <button className="link-button" onClick={() => navigate('/role')}>
          Back to role selection
        </button>
      </div>
    </div>
  )
}

export default SpecialtySelectionPage
