import type { CaseStudy } from '../../types/learning'

type CaseSidebarProps = {
  activeSpecialtyLabel?: string
  roleLabel?: string
  caseStudies: CaseStudy[]
  selectedCaseId?: string
  onSelectCase: (caseId: string) => void
  onBack?: () => void
}

const CaseSidebar = ({
  activeSpecialtyLabel,
  roleLabel,
  caseStudies,
  selectedCaseId,
  onSelectCase,
  onBack,
}: CaseSidebarProps) => {
  return (
    <aside className="learning-sidebar">
      <div className="sidebar-specialty">
        <button className="sidebar-back" onClick={onBack}>
          ← Specialties
        </button>
        <h2>{activeSpecialtyLabel ?? 'Learning Pathway'}</h2>
        <p>{roleLabel ? `${roleLabel} View` : 'Personalized Journey'}</p>
      </div>

      <nav className="case-list">
        <h3>Patient List</h3>
        <ul>
          {caseStudies.map((caseStudy) => (
            <li key={caseStudy.id}>
              <button
                type="button"
                className={
                  caseStudy.id === selectedCaseId ? 'case-item active' : 'case-item'
                }
                onClick={() => onSelectCase(caseStudy.id)}
              >
                {caseStudy.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-link">
          ⚙ App settings
        </button>
        <button type="button" className="sidebar-link">
          ⏻ Sign out
        </button>
      </div>
    </aside>
  )
}

export default CaseSidebar
