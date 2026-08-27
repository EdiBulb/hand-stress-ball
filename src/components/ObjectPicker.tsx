import { useRef, useState } from 'react'
import { MATERIALS } from '../materials/materials'

interface ObjectPickerProps {
  onSelect: (materialId: string, imageUrl?: string) => void
}

export function ObjectPicker({ onSelect }: ObjectPickerProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [chosenMaterialId, setChosenMaterialId] = useState(MATERIALS[0].id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedUrl(URL.createObjectURL(file))
  }

  const confirmUpload = () => {
    if (!uploadedUrl) return
    onSelect(chosenMaterialId, uploadedUrl)
  }

  return (
    <div className="picker">
      <h1>무엇을 쥐어보고 싶으세요?</h1>
      <div className="picker-grid">
        {MATERIALS.map((m) => (
          <button key={m.id} className="picker-card" onClick={() => onSelect(m.id)}>
            <span className="picker-emoji">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}

        <button className="picker-card picker-card-upload" onClick={() => setUploading(true)}>
          <span className="picker-emoji">📷</span>
          <span>내 스트레스볼 추가하기</span>
        </button>
      </div>

      {uploading && (
        <div className="upload-panel">
          <p>사진을 올리고, 어떤 재질에 가까운지 골라주세요.</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />

          {uploadedUrl && <img className="upload-preview" src={uploadedUrl} alt="업로드한 사진 미리보기" />}

          <select value={chosenMaterialId} onChange={(e) => setChosenMaterialId(e.target.value)}>
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>

          <div className="upload-actions">
            <button className="btn-secondary" onClick={() => setUploading(false)}>
              취소
            </button>
            <button className="btn-primary" onClick={confirmUpload} disabled={!uploadedUrl}>
              이걸로 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
