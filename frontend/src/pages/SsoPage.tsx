import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const providers = ['Google', 'Microsoft', 'Apple']

const SsoPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      return
    }
    navigate('/role', { state: { email } })
  }

  return (
    <div className="page-layout">
      <div className="panel">
        <h1 className="panel-title">Welcome to LearnHPB</h1>
        <p className="panel-subtitle">
          Sign in with your institution credentials to continue.
        </p>

        <div className="sso-buttons">
          {providers.map((provider) => (
            <button
              key={provider}
              className="primary-button outline"
              type="button"
              onClick={() => navigate('/role', { state: { provider } })}
            >
              Continue with {provider}
            </button>
          ))}
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="sso-form">
          <label htmlFor="email-input" className="form-label">
            Email
          </label>
          <input
            id="email-input"
            type="email"
            placeholder="name@example.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="text-input"
            required
          />
          <button type="submit" className="primary-button">
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

export default SsoPage
