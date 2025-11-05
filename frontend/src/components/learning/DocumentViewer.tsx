import { useEffect, useState } from 'react'
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
  const [documentContent, setDocumentContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0]

  useEffect(() => {
    if (!activeDocument) {
      setDocumentContent('')
      setIsLoading(false)
      setError(null)
      return
    }

    if (!activeDocument.contentPath) {
      setDocumentContent(
        activeDocument.content ??
          activeDocument.summary ??
          'Content coming soon.',
      )
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const loadContent = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}${activeDocument.contentPath}`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const text = await response.text()
        setDocumentContent(text)
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return
        }

        console.error('Failed to load document content', err)
        setError('Unable to load this document right now.')
        setDocumentContent(
          activeDocument.summary ??
            activeDocument.content ??
            'Content coming soon.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadContent()

    return () => controller.abort()
  }, [activeDocument])

  const renderContent = () => {
    if (!activeDocument) {
      return <p>No documents available.</p>
    }

    if (isLoading) {
      return <p>Loading document…</p>
    }

    if (error) {
      return <p className="document-error">{error}</p>
    }

    if (!documentContent) {
      return <p>Content coming soon.</p>
    }

    return documentContent
      .split(/\r?\n\r?\n/)
      .filter((paragraph) => paragraph.trim().length > 0)
      .map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)
  }

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
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
