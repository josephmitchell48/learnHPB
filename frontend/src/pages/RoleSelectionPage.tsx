import { useLocation, useNavigate } from 'react-router-dom'

type LocationState = {
  email?: string
  provider?: string
}

const roles = [
  {
    id: 'educator',
    title: 'Educator',
    description:
      'Coming Soon!!',
  },
  {
    id: 'student',
    title: 'Student',
    description:
      'Explore curated content, track your performance, and practice clinical decision-making.',
  },
]

const RoleSelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { email, provider } = (location.state as LocationState) ?? {}

  const goToSpecialties = (role: string) => {
    navigate('/specialties', { state: { role, email, provider } })
  }

  return (
    <div className="page-layout">
      <div className="card-grid two-columns">
        {roles.map((role) => {
          const isEducator = role.id === 'educator'
          return (
            <button
              key={role.id}
              className={`card-button role-card${isEducator ? ' role-card--disabled' : ''}`}
              type="button"
              disabled={isEducator}
              aria-disabled={isEducator}
              onClick={
                isEducator ? undefined : () => goToSpecialties(role.id)
              }
            >
              <h1 className="panel-title">{role.title}</h1>
              <h3 className="role-card-text">{role.description}</h3>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RoleSelectionPage
