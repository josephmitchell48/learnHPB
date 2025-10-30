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
        <h2 className="panel-title">Choose a specialty to explore</h2>
        <p className="panel-subtitle">
          {capitalizedRole
            ? `Let’s get started with resources curated for ${capitalizedRole}s.`
            : 'Select a specialty tile to preview tailored content.'}
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
                ? `Preparing ${roleArticle} ${capitalizedRole} learning pathway for ${selectedSpecialty.title}.`
                : `Great choice! We will tailor content for ${selectedSpecialty.title}.`}
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
