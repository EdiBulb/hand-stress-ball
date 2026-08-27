import { useEffect, useState } from 'react'
import type { MaterialConfig } from '../materials/types'
import { Particles } from './Particles'

interface SqueezeObjectProps {
  material: MaterialConfig
  gripAmount: number
  imageUrl?: string
}

const SOUND_TRIGGER_THRESHOLD = 0.55

// Painted above every material's own texture so every ball reads as a
// rounded, lit sphere regardless of what it's made of.
const SPHERE_HIGHLIGHT = 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 45%)'
const SPHERE_SHADOW = 'radial-gradient(circle at 75% 82%, rgba(0,0,0,0.35), transparent 55%)'

export function SqueezeObject({ material, gripAmount, imageUrl }: SqueezeObjectProps) {
  const [prevGrip, setPrevGrip] = useState(0)
  const [retainedSquish, setRetainedSquish] = useState(0) // for 'plastic' materials
  const [soundTriggerCount, setSoundTriggerCount] = useState(0)
  const [particleBurstSignal, setParticleBurstSignal] = useState(0)
  const [squeezeEvents, setSqueezeEvents] = useState(0) // drives shrinking for consumable materials

  // Grip changes every animation frame, so we adjust derived state directly
  // during render (React's recommended pattern for "state derived from a
  // changing prop") instead of via an Effect -- that avoids an extra
  // render+commit cycle on every single frame.
  if (gripAmount !== prevGrip) {
    const risingPastSound = prevGrip < SOUND_TRIGGER_THRESHOLD && gripAmount >= SOUND_TRIGGER_THRESHOLD
    const risingPastParticle =
      material.particle &&
      material.particleThreshold !== undefined &&
      prevGrip < material.particleThreshold &&
      gripAmount >= material.particleThreshold

    setPrevGrip(gripAmount)
    if (material.squishStyle === 'plastic' && gripAmount > retainedSquish) {
      setRetainedSquish(gripAmount)
    }
    if (risingPastSound) {
      setSoundTriggerCount((n) => n + 1)
      if (material.consumable) setSqueezeEvents((n) => n + 1)
    }
    if (risingPastParticle) {
      setParticleBurstSignal((n) => n + 1)
    }
  }

  // Actually playing a sound is a genuine side effect (talks to the Web
  // Audio API), so -- unlike the state above -- it belongs in an Effect.
  useEffect(() => {
    if (soundTriggerCount === 0) return
    material.playSound(gripAmount)
    // Only re-run when a new squeeze is detected, not on every grip change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundTriggerCount])

  const remainingSize = material.consumable ? Math.max(1 - squeezeEvents * 0.08, 0.25) : 1
  const squishInput = material.squishStyle === 'plastic' ? Math.max(gripAmount, retainedSquish) : gripAmount
  const squishAmount = Math.min(squishInput * (1 - material.resistance * 0.7), 1)

  const scaleX = (1 + squishAmount * 0.35) * remainingSize
  const scaleY = (1 - squishAmount * 0.35) * remainingSize

  // Precedence: a user-uploaded photo > the material's real artwork > the
  // original flat CSS gradient/pattern (kept as a fallback for materials
  // that never got real artwork, and as what briefly shows while `image`
  // loads).
  const artworkUrl = imageUrl ?? material.image
  const layers = [SPHERE_HIGHLIGHT, SPHERE_SHADOW, material.pattern, material.background].filter(Boolean).join(', ')
  const sizes = material.patternSize ? `auto, auto, ${material.patternSize}, auto` : undefined

  return (
    <div className="squeeze-stage">
      <div
        className="squeeze-object"
        style={
          artworkUrl
            ? {
                backgroundImage: `${SPHERE_HIGHLIGHT}, ${SPHERE_SHADOW}, url(${artworkUrl})`,
                backgroundSize: imageUrl ? 'auto, auto, cover' : 'auto, auto, contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                transform: `scale(${scaleX}, ${scaleY})`,
              }
            : {
                backgroundImage: layers,
                backgroundSize: sizes,
                backgroundPosition: 'center',
                transform: `scale(${scaleX}, ${scaleY})`,
              }
        }
      />
      <Particles burstSignal={particleBurstSignal} kind={material.particle} />
    </div>
  )
}
