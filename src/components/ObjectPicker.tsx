import { useRef, useState } from 'react'
import { MATERIALS } from '../materials/materials'
import { cropImageToSquarePng } from '../lib/cropToSquare'
import { uploadBall } from '../lib/ballsApi'
import { VisitCounter } from './VisitCounter'

interface ObjectPickerProps {
  onSelect: (materialId: string, imageUrl?: string) => void
  onViewGallery: () => void
}

type ShareState = 'idle' | 'sharing' | 'shared' | 'error'

export function ObjectPicker({ onSelect, onViewGallery }: ObjectPickerProps) {
  const [uploading, setUploading] = useState(false)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [chosenMaterialId, setChosenMaterialId] = useState(MATERIALS[0].id)
  const [name, setName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [shareState, setShareState] = useState<ShareState>('idle')
  const [shareError, setShareError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setShareState('idle')
    setShareError(null)

    // Standardize every upload to the same square format the built-in
    // materials use, right in the browser -- this is what keeps the
    // community gallery looking consistent (see backend-plan.ko.md).
    const squared = await cropImageToSquarePng(file)
    setCroppedBlob(squared)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(squared))
  }

  const playLocally = () => {
    if (!previewUrl) return
    onSelect(chosenMaterialId, previewUrl)
  }

  const shareAndPlay = async () => {
    if (!croppedBlob || !name.trim() || !creatorName.trim()) return
    setShareState('sharing')
    setShareError(null)
    try {
      await uploadBall({
        image: croppedBlob,
        name: name.trim(),
        creatorName: creatorName.trim(),
        materialId: chosenMaterialId,
      })
      setShareState('shared')
    } catch (err) {
      setShareState('error')
      setShareError(err instanceof Error ? err.message : 'Sharing failed.')
      return
    }
    // Sharing succeeded (or was skipped) -- still let them play immediately
    // with their own local copy, no need to wait for approval.
    playLocally()
  }

  const canShare = !!croppedBlob && name.trim().length > 0 && creatorName.trim().length > 0 && shareState !== 'sharing'

  return (
    <div className="picker">
      <h1>What do you want to squeeze?</h1>
      <div className="picker-grid">
        {MATERIALS.map((m) => (
          <button key={m.id} className="picker-card" onClick={() => onSelect(m.id)}>
            <span className="picker-emoji">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}

        <button className="picker-card picker-card-upload" onClick={() => setUploading(true)}>
          <span className="picker-emoji">📷</span>
          <span>Add my own stress ball</span>
        </button>

        <button className="picker-card picker-card-gallery" onClick={onViewGallery}>
          <span className="picker-emoji">🖼️</span>
          <span>Browse balls made by others</span>
        </button>
      </div>

      {uploading && (
        <div className="upload-panel">
          <p>Upload a photo and pick the material it's closest to.</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />

          {previewUrl && <img className="upload-preview" src={previewUrl} alt="Uploaded photo preview" />}

          <select value={chosenMaterialId} onChange={(e) => setChosenMaterialId(e.target.value)}>
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Name this ball"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
          <input
            type="text"
            placeholder="Your name"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            maxLength={40}
          />

          <p className="upload-hint">Shared balls are reviewed before others can see them.</p>

          {shareState === 'error' && shareError && <p className="upload-error">{shareError}</p>}
          {shareState === 'shared' && <p className="upload-success">Shared! It will show up once approved.</p>}

          <div className="upload-actions">
            <button className="btn-secondary" onClick={() => setUploading(false)}>
              Cancel
            </button>
            <button className="btn-secondary" onClick={playLocally} disabled={!previewUrl}>
              Just for me
            </button>
            <button className="btn-primary" onClick={shareAndPlay} disabled={!canShare}>
              {shareState === 'sharing' ? 'Sharing...' : 'Share & start'}
            </button>
          </div>
        </div>
      )}

      <VisitCounter />
    </div>
  )
}
