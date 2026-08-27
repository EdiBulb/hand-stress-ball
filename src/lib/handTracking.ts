import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'

// Model + WASM assets are loaded from Google's CDN at runtime so we don't
// have to bundle/host a multi-megabyte model file ourselves.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let landmarkerPromise: Promise<HandLandmarker> | null = null

/** Lazily creates (once) and reuses a single HandLandmarker instance. */
function getLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then((vision) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
      }),
    )
  }
  return landmarkerPromise
}

export interface HandFrame {
  landmarks: Array<{ x: number; y: number; z: number }> | null
}

/**
 * Runs hand detection on a single video frame. `video` must already be
 * playing. Call this once per animation frame from a requestAnimationFrame
 * loop -- it is cheap to call repeatedly since the landmarker is reused.
 */
export async function detectHandInVideo(video: HTMLVideoElement): Promise<HandFrame> {
  const landmarker = await getLandmarker()
  const result: HandLandmarkerResult = landmarker.detectForVideo(video, performance.now())
  const hand = result.landmarks?.[0] ?? null
  return { landmarks: hand }
}
