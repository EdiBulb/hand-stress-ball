import { useEffect, useRef, useState } from 'react'
import { detectHandInVideo } from './handTracking'
import { createGripTracker, createBoundsTracker, type HandBounds } from './gripAmount'

interface HandGripState {
  videoRef: React.RefObject<HTMLVideoElement | null>
  gripAmount: number
  handPresent: boolean
  /** Smoothed centroid + radius of the hand, in native (unmirrored) video-normalized coordinates. */
  handBounds: HandBounds | null
  cameraError: string | null
  ready: boolean
}

export function useHandGrip(active: boolean): HandGripState {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [gripAmount, setGripAmount] = useState(0)
  const [handPresent, setHandPresent] = useState(false)
  const [handBounds, setHandBounds] = useState<HandBounds | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let stream: MediaStream | null = null
    let rafId: number | null = null
    const gripTracker = createGripTracker()
    const boundsTracker = createBoundsTracker()

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        if (cancelled || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)

        const loop = async () => {
          if (cancelled || !videoRef.current) return
          const frame = await detectHandInVideo(videoRef.current)
          setHandPresent(!!frame.landmarks)
          setGripAmount(gripTracker.update(frame.landmarks))
          setHandBounds(boundsTracker.update(frame.landmarks))
          rafId = requestAnimationFrame(loop)
        }
        rafId = requestAnimationFrame(loop)
      } catch (err) {
        if (!cancelled) {
          setCameraError(err instanceof Error ? err.message : '카메라를 시작할 수 없어요')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((track) => track.stop())
      setReady(false)
      setHandPresent(false)
      setGripAmount(0)
      setHandBounds(null)
    }
  }, [active])

  return { videoRef, gripAmount, handPresent, handBounds, cameraError, ready }
}
