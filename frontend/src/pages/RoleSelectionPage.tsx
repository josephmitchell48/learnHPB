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
      'Access curriculum tools, create learning experiences, and monitor learner progress.',
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
      <div className="panel">
        <h2 className="panel-title">Choose your role</h2>
        <p className="panel-subtitle">
          We tailor the experience based on how you use LearnHPB.
        </p>
        <div className="card-grid two-columns">
          {roles.map((role) => (
            <button
              key={role.id}
              className="card-button"
              type="button"
              onClick={() => goToSpecialties(role.id)}
            >
              <h3>{role.title}</h3>
              <p>{role.description}</p>
            </button>
          ))}
        </div>
        {(email || provider) && (
          <p className="hint">
            Signed in as{' '}
            {email ? email : `via ${provider?.toLocaleLowerCase() ?? 'SSO'}`}.
          </p>
        )}
      </div>
    </div>
  )
}

export default RoleSelectionPage
