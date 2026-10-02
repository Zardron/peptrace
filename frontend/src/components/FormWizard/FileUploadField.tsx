import { useRef, useState } from 'react'
import { apiFetch } from '../../lib/api'
import uploadIcon from '../../assets/icons/281_5401.svg'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = 'image/*,application/pdf'

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const isPdfUrl = (url: string): boolean => url.split('?')[0].toLowerCase().endsWith('.pdf')

interface FileUploadFieldProps {
  uploadType: 'batch-id-proof' | 'coa' | 'purchase-proof'
  value: string | null
  onChange: (url: string | null) => void
}

export default function FileUploadField({ uploadType, value, onChange }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFile = async (file: File | undefined | null) => {
    if (!file || uploading) return
    setError('')
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !isPdf) {
      setError('Please choose an image or PDF file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be smaller than 5 MB.')
      return
    }

    setUploading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || (isPdf ? 'pdf' : 'png')
      const base64 = await readFileAsBase64(file)
      const data = await apiFetch('/uploads/form', {
        method: 'POST',
        body: JSON.stringify({ file: base64, contentType: file.type, extension, uploadType }),
      })
      onChange(data.path)
      setPreviewUrl(data.previewUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the file. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="fw-upload-preview">
        {previewUrl ? (
          isPdfUrl(value) ? (
            <iframe src={previewUrl} title="Uploaded document preview" className="fw-upload-preview-pdf" />
          ) : (
            <img src={previewUrl} alt="Uploaded file preview" className="fw-upload-preview-image" />
          )
        ) : <span>Private file attached</span>}
        <div className="fw-upload-preview-actions">
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="fw-upload-preview-link">
              View full file
            </a>
          ) : null}
          <button
            type="button"
            className="fw-upload-preview-remove"
            onClick={() => {
              setPreviewUrl(null)
              onChange(null)
            }}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`fw-upload ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        {uploading ? (
          <>
            <span className="fw-upload-spinner" />
            <span className="fw-upload-text">Uploading…</span>
          </>
        ) : (
          <>
            <img src={uploadIcon} alt="" className="fw-upload-icon" />
            <span className="fw-upload-text">Click or drag a file here to upload</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && <span className="fw-upload-error">{error}</span>}
    </>
  )
}
