import { useEffect, useState } from 'react'
import { Viewer, Worker } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'
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
  const [reloadToken, setReloadToken] = useState(0)

  const activeDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0]
  const documentUrl = activeDocument?.contentPath
    ? `${import.meta.env.BASE_URL}${activeDocument.contentPath}`
    : null
  const isPdfDocument = Boolean(
    documentUrl && documentUrl.toLowerCase().endsWith('.pdf'),
  )
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  useEffect(() => {
    setError(null)

    if (!activeDocument) {
      setDocumentContent('')
      setIsLoading(false)
      return
    }

    if (!documentUrl) {
      setDocumentContent(
        activeDocument.content ??
          activeDocument.summary ??
          'Content coming soon.',
      )
      setIsLoading(false)
      return
    }

    if (isPdfDocument) {
      setDocumentContent('')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const loadContent = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(documentUrl, {
          signal: controller.signal,
        })

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
  }, [activeDocument, documentUrl, isPdfDocument, reloadToken])

  const handleReload = () => {
    if (!documentUrl || isPdfDocument) {
      return
    }
    setReloadToken((token) => token + 1)
  }

  const handleOpenInNewTab = () => {
    if (!documentUrl || typeof window === 'undefined') {
      return
    }

    window.open(documentUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = () => {
    if (!documentUrl || typeof document === 'undefined') {
      return
    }

    const link = document.createElement('a')
    link.href = documentUrl
    const safeTitle = activeDocument?.title
      ? activeDocument.title.replace(/\s+/g, '_')
      : 'learning-document'
    const filenameFragment = documentUrl.split('/').pop() ?? ''
    const extensionMatch = filenameFragment.match(/\.[\w-]+(?=$|\?)/)
    const extension = extensionMatch ? extensionMatch[0] : ''
    link.download = `${safeTitle}${extension}`
    document.body.append(link)
    link.click()
    link.remove()
  }

  const renderDocumentSummary = () => {
    if (!activeDocument?.summary?.trim()) {
      return null
    }

    return (
      <section className="document-summary">
        <h3>Quick overview</h3>
        <p>{activeDocument.summary}</p>
      </section>
    )
  }

  const renderContent = () => {
    if (!activeDocument) {
      return <p>No documents available.</p>
    }

    const summaryBlock = renderDocumentSummary()

    if (isPdfDocument && documentUrl) {
      return (
        <>
          <div className="pdf-viewer-wrapper">
            <Worker workerUrl={pdfWorker}>
              <Viewer
                fileUrl={documentUrl}
                plugins={[defaultLayoutPluginInstance]}
              />
            </Worker>
          </div>
          {summaryBlock}
        </>
      )
    }

    if (isLoading) {
      return <p>Loading document…</p>
    }

    if (error) {
      return <p className="document-error">{error}</p>
    }

    if (!documentContent) {
      return (
        <>
          <p>Content coming soon.</p>
          {summaryBlock}
        </>
      )
    }

    return (
      <>
        <article className="document-article">
          {documentContent
            .split(/\r?\n\r?\n/)
            .filter((paragraph) => paragraph.trim().length > 0)
            .map((paragraph, index) => (
              <p key={`paragraph-${index}`}>{paragraph.trim()}</p>
            ))}
        </article>
        {summaryBlock}
      </>
    )
  }

  const viewerContentClassName = isPdfDocument
    ? 'viewer-content viewer-content--pdf'
    : 'viewer-content'

  return (
    <div className="case-body">
      <div className="document-list document-list--bar">
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
            <button
              type="button"
              onClick={handleReload}
              disabled={!documentUrl || isPdfDocument}
            >
              ↻ Refresh
            </button>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              disabled={!documentUrl}
            >
              ⤢ Open
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!documentUrl}
            >
              ⬇ Download
            </button>
          </div>
        </div>
        <div className={viewerContentClassName}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
