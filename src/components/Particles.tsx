import { useEffect, useState } from 'react'
import type { ParticleKind } from '../materials/types'

interface ParticlePiece {
  dx: number
  dy: number
  size: number
  delay: number
}

interface Burst {
  id: number
  pieces: ParticlePiece[]
}

interface ParticlesProps {
  /** Increment this from the parent to fire a new burst. */
  burstSignal: number
  kind: ParticleKind
}

const PARTICLE_COLOR: Record<string, string> = {
  smoke: '#84cc16',
  spark: '#facc15',
  dust: '#a8a29e',
  droplet: '#38bdf8',
  splinter: '#92643a',
  sand: '#eab308',
  crack: '#57534e',
}

let nextBurstId = 0

export function Particles({ burstSignal, kind }: ParticlesProps) {
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    if (burstSignal === 0 || !kind) return

    const pieces: ParticlePiece[] = Array.from({ length: 10 }, () => {
      const angle = Math.random() * Math.PI * 2
      const distance = 30 + Math.random() * 50
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 0.05,
      }
    })

    const id = nextBurstId++
    setBursts((prev) => [...prev, { id, pieces }])
    const timeout = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, 700)
    return () => clearTimeout(timeout)
    // Only re-fire when the parent increments burstSignal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstSignal])

  if (!kind) return null

  return (
    <div className="particles-layer">
      {bursts.map((burst) =>
        burst.pieces.map((p, i) => (
          <span
            key={`${burst.id}-${i}`}
            className="particle"
            style={{
              backgroundColor: PARTICLE_COLOR[kind],
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              ['--dx' as string]: `${p.dx}px`,
              ['--dy' as string]: `${p.dy}px`,
            }}
          />
        )),
      )}
    </div>
  )
}
