import type { CaseDocument } from '../../types/learning'

type DocumentViewerProps = {
  documents: CaseDocument[]
  selectedDocumentId?: string | null
  onSelectDocument: (documentId: string) => void
}

const placeholderDocument = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent porttitor congue erat,
non commodo magna porta quis. Sed porta volutpat elit, nec iaculis mauris blandit nec. Morbi vitae
venenatis felis. Suspendisse potenti. Sed malesuada lorem id aliquam lacinia. Pellentesque sit amet
felis a nisl feugiat tempus. Donec pulvinar volutpat nunc, sed gravida massa accumsan et. Fusce at
libero eu augue aliquet hendrerit. Integer euismod, ligula non imperdiet semper, neque erat iaculis
metus, ac aliquet risus nibh vitae augue. Nulla facilisi. Quisque dignissim consequat nisi, vitae
tempor ante vulputate ac.`

const DocumentViewer = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: DocumentViewerProps) => {
  const activeDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0]

  return (
    <div className="case-body">
      <div className="document-list">
        <h2>Document List</h2>
        <ul>
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                className={
                  doc.id === selectedDocumentId
                    ? 'document-item active'
                    : 'document-item'
                }
                onClick={() => onSelectDocument(doc.id)}
              >
                <strong>{doc.title}</strong>
                <span>{doc.summary}</span>
              </button>
            </li>
          ))}
        </ul>
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
          <p>{placeholderDocument}</p>
          <p>{placeholderDocument}</p>
          <p>{placeholderDocument}</p>
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
