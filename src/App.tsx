import { useState } from 'react'
import { ObjectPicker } from './components/ObjectPicker'
import { Gallery } from './components/Gallery'
import { HandCameraStage } from './components/HandCameraStage'
import './App.css'

type Step = 'select' | 'gallery' | 'camera'

export default function App() {
  const [step, setStep] = useState<Step>('select')
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)

  const handleSelect = (id: string, url?: string) => {
    setMaterialId(id)
    setImageUrl(url)
    setStep('camera')
  }

  const handleBack = () => {
    setStep('select')
    setMaterialId(null)
    setImageUrl(undefined)
  }

  return (
    <main className="app">
      {step === 'select' && <ObjectPicker onSelect={handleSelect} onViewGallery={() => setStep('gallery')} />}
      {step === 'gallery' && <Gallery onSelect={handleSelect} onBack={() => setStep('select')} />}
      {step === 'camera' && materialId && (
        <HandCameraStage materialId={materialId} imageUrl={imageUrl} onBack={handleBack} />
      )}
    </main>
  )
}
