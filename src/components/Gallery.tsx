import { useEffect, useState } from 'react'
import { fetchApprovedBalls, type GalleryBall } from '../lib/ballsApi'

interface GalleryProps {
  onSelect: (materialId: string, imageUrl?: string) => void
  onBack: () => void
}

type LoadState = 'loading' | 'ready' | 'error'

export function Gallery({ onSelect, onBack }: GalleryProps) {
  const [balls, setBalls] = useState<GalleryBall[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchApprovedBalls()
      .then((result) => {
        if (cancelled) return
        setBalls(result)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load the list.')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="picker">
      <h1>Balls made by others</h1>

      {state === 'loading' && <p>Loading...</p>}
      {state === 'error' && <p className="upload-error">{error}</p>}
      {state === 'ready' && balls.length === 0 && <p>No balls shared yet. Be the first!</p>}

      {state === 'ready' && balls.length > 0 && (
        <div className="gallery-grid">
          {balls.map((ball) => (
            <button
              key={ball.id}
              className="gallery-card"
              onClick={() => onSelect(ball.materialId, ball.imageUrl)}
            >
              <img className="gallery-thumb" src={ball.imageUrl} alt={ball.name} />
              <span className="gallery-name">{ball.name}</span>
              <span className="gallery-creator">by {ball.creatorName}</span>
            </button>
          ))}
        </div>
      )}

      <button className="btn-secondary" onClick={onBack}>
        Back
      </button>
    </div>
  )
}
