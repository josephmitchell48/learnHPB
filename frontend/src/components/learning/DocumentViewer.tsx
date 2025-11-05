import type { CaseDocument } from '../../types/learning'

type DocumentViewerProps = {
  documents: CaseDocument[]
  selectedDocumentId?: string | null
  onSelectDocument: (documentId: string) => void
}

const DocumentViewer = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: DocumentViewerProps) => {
  const activeDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0]

  const logoSrc = '/assets/nova-scotia-health-logo.png'

  const renderBody = () => {
    if (!activeDocument) {
      return <p>No document content available.</p>
    }

    if (activeDocument.format === 'html') {
      return (
        <div
          className="document-body-html"
          dangerouslySetInnerHTML={{ __html: activeDocument.body }}
        />
      )
    }

    const paragraphs = activeDocument.body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    return paragraphs.length ? (
      paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
    ) : (
      <p>No document content available.</p>
    )
  }

  return (
    <div className="document-stack">
      <div className="document-list-row">
        <div className="document-row-buttons">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={doc.id === activeDocument?.id ? 'document-item active' : 'document-item'}
              onClick={() => onSelectDocument(doc.id)}
            >
              {doc.title}
            </button>
          ))}
        </div>
      </div>

      <div className="document-viewer">
        <div className="viewer-toolbar">
          <span className="viewer-title">
            {activeDocument?.title ?? 'Learning Document'}
          </span>
          <div className="viewer-actions">
            <button type="button">⟲</button>
            <button type="button">⤢</button>
            <button type="button">⬇</button>
          </div>
        </div>
        <div className="viewer-content">
          <div className="document-header">
            <img src={logoSrc} alt="Nova Scotia Health" className="document-header__logo" />
            <p className="document-header__disclaimer">
              Educational sample – not real patient documentation. Content generated for training only.
            </p>
          </div>
          {renderBody()}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
