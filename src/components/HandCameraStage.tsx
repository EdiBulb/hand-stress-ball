import { useEffect, useRef, useState } from 'react'
import { useHandGrip } from '../lib/useHandGrip'
import { getMaterialById } from '../materials/materials'
import { SqueezeObject } from './SqueezeObject'

interface HandCameraStageProps {
  materialId: string
  imageUrl?: string
  onBack: () => void
}

const HOLD_TO_START_MS = 600

// Canvas render tuning. The video itself is never shown on screen -- it is
// only ever used as a drawImage() source. Everything visible comes from the
// canvas, so the face can never leak: only a small, hand-centered crop is
// ever drawn sharp.
const BACKGROUND_BLUR_PX = 28
const BACKGROUND_DARKEN = 0.42
const HAND_CROP_ZOOM = 3.2
const NO_HAND_CROP_RATIO = 0.68 // fallback crop size (as a fraction of the video's shorter side) before a hand is found
const MIN_CROP_RATIO = 0.16
const MAX_CROP_RATIO = 0.85
const PORTHOLE_RATIO = 0.26 // porthole radius as a fraction of the shorter canvas side
const RING_COLOR = 'rgba(255, 255, 255, 0.85)'

/** Source rect that replicates CSS `object-fit: cover` for a sourceW x sourceH image drawn into a destW x destH box. */
function computeCoverRect(sourceW: number, sourceH: number, destW: number, destH: number) {
  const sourceRatio = sourceW / sourceH
  const destRatio = destW / destH
  if (sourceRatio > destRatio) {
    const sh = sourceH
    const sw = sourceH * destRatio
    return { sx: (sourceW - sw) / 2, sy: 0, sw, sh }
  }
  const sw = sourceW
  const sh = sourceW / destRatio
  return { sx: 0, sy: (sourceH - sh) / 2, sw, sh }
}

export function HandCameraStage({ materialId, imageUrl, onBack }: HandCameraStageProps) {
  const { videoRef, gripAmount, handPresent, handBounds, cameraError, ready } = useHandGrip(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'positioning' | 'playing'>('positioning')
  const holdTimerRef = useRef<number | null>(null)

  const material = getMaterialById(materialId)

  useEffect(() => {
    if (phase !== 'positioning') return

    if (handPresent) {
      if (holdTimerRef.current === null) {
        holdTimerRef.current = window.setTimeout(() => setPhase('playing'), HOLD_TO_START_MS)
      }
    } else if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }, [handPresent, phase])

  // Render loop: draws a blurred + darkened full-frame background, then a
  // sharp circular "porthole" fixed at screen-center whose *source* crop
  // follows the tracked hand. The user's face is never drawn sharp and
  // never appears in the visible <video> element (it stays hidden), so it
  // can't leak onto screen no matter where the camera is pointed.
  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const container = containerRef.current
    if (!canvas || !video || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number

    const draw = () => {
      rafId = requestAnimationFrame(draw)

      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const dpr = window.devicePixelRatio || 1
      const pixelW = Math.round(container.clientWidth * dpr)
      const pixelH = Math.round(container.clientHeight * dpr)
      if (pixelW === 0 || pixelH === 0) return
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW
        canvas.height = pixelH
      }

      const canvasW = canvas.width
      const canvasH = canvas.height

      // One mirror transform for the whole frame, so every draw call below
      // can use natural (unmirrored) video coordinates.
      ctx.save()
      ctx.translate(canvasW, 0)
      ctx.scale(-1, 1)

      const bg = computeCoverRect(vw, vh, canvasW, canvasH)
      ctx.filter = `blur(${BACKGROUND_BLUR_PX}px) brightness(${BACKGROUND_DARKEN})`
      ctx.drawImage(video, bg.sx, bg.sy, bg.sw, bg.sh, 0, 0, canvasW, canvasH)
      ctx.filter = 'none'

      const minVideoSide = Math.min(vw, vh)
      let cropSide: number
      let centerX: number
      let centerY: number
      if (handBounds) {
        cropSide = handBounds.radius * minVideoSide * HAND_CROP_ZOOM
        centerX = handBounds.x * vw
        centerY = handBounds.y * vh
      } else {
        cropSide = minVideoSide * NO_HAND_CROP_RATIO
        centerX = vw / 2
        centerY = vh / 2
      }
      cropSide = Math.min(Math.max(cropSide, minVideoSide * MIN_CROP_RATIO), minVideoSide * MAX_CROP_RATIO)

      const sx = Math.min(Math.max(centerX - cropSide / 2, 0), vw - cropSide)
      const sy = Math.min(Math.max(centerY - cropSide / 2, 0), vh - cropSide)

      const circleRadius = Math.min(canvasW, canvasH) * PORTHOLE_RATIO
      const circleCenterX = canvasW / 2
      const circleCenterY = canvasH / 2

      ctx.save()
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(
        video,
        sx,
        sy,
        cropSide,
        cropSide,
        circleCenterX - circleRadius,
        circleCenterY - circleRadius,
        circleRadius * 2,
        circleRadius * 2,
      )
      ctx.restore()

      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2)
      ctx.lineWidth = 4 * dpr
      ctx.strokeStyle = RING_COLOR
      ctx.stroke()

      ctx.restore()
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [handBounds, videoRef])

  if (!material) return null

  if (cameraError) {
    return (
      <div className="camera-stage">
        <p>카메라 권한이 필요해요. 브라우저 설정에서 카메라 접근을 허용해주세요.</p>
        <button className="btn-secondary" onClick={onBack}>
          뒤로
        </button>
      </div>
    )
  }

  return (
    <div className="camera-stage" ref={containerRef}>
      {/* Never displayed -- used only as a drawImage() source for the canvas below. */}
      <video ref={videoRef} className="camera-feed-source" muted playsInline aria-hidden="true" />
      <canvas ref={canvasRef} className="camera-canvas" />

      {phase === 'positioning' && (
        <div className="hand-guide-overlay">
          <div className="hand-guide-outline">🖐️</div>
          <p>{ready ? '여기에 손을 위치시키세요' : '카메라를 켜는 중...'}</p>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="floating-object">
            <SqueezeObject material={material} gripAmount={gripAmount} imageUrl={imageUrl} />
          </div>
          {!handPresent && <p className="hand-lost-hint">손이 안 보여요, 카메라 앞에 손을 보여주세요</p>}
        </>
      )}

      <button className="btn-secondary camera-back-btn" onClick={onBack}>
        다른 거 고르기
      </button>
    </div>
  )
}
