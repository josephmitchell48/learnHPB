import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LearningPage from './pages/LearningPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import SpecialtySelectionPage from './pages/SpecialtySelectionPage'
import SsoPage from './pages/SsoPage'

const App = () => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand-mark">LearnHPB</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<SsoPage />} />
          <Route path="/role" element={<RoleSelectionPage />} />
          <Route path="/specialties" element={<SpecialtySelectionPage />} />
          <Route path="/learning/:specialtyId" element={<LearningPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <small>&copy; {new Date().getFullYear()} LearnHPB</small>
      </footer>
    </div>
  )
}

export default App
