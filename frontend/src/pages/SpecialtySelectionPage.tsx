import { useLocation, useNavigate } from 'react-router-dom'
import { specialties } from '../data/specialties'

type LocationState = {
  role?: string
  email?: string
  provider?: string
}

const SpecialtySelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, email, provider } = (location.state as LocationState) ?? {}

  return (
    <div className="page-layout">
      <div className="panel">
        <h2 className="panel-title">Select an HPB focus area</h2>
        <div className="card-grid two-columns">
          {specialties.map((specialty) => {
            const isLiver = specialty.id === 'hpb-liver'
            return (
              <button
                key={specialty.id}
                className={`card-button specialty-card${isLiver ? '': ' role-card--disabled'}`}
                type="button"
                onClick={ isLiver ?  () =>
                  navigate(`/learning/${specialty.id}`, {
                    state: {
                      role: role ?? 'guest',
                      email,
                      provider,
                      specialty,
                    },
                  }) 
                  : undefined
                }
              >
                <div className="card-accent" aria-hidden />
                <div className="card-content">
                  <h3>{specialty.title}</h3>
                  <p>{specialty.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <button className="link-button" onClick={() => navigate('/role')}>
          Back to role selection
        </button>
      </div>
    </div>
  )
}

export default SpecialtySelectionPage
