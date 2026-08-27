export interface Point3D {
  x: number
  y: number
  z: number
}

// MediaPipe hand landmark indices we care about.
const WRIST = 0
const MIDDLE_MCP = 9
const FINGER_JOINTS: Array<{ mcp: number; tip: number }> = [
  { mcp: 5, tip: 8 }, // index
  { mcp: 9, tip: 12 }, // middle
  { mcp: 13, tip: 16 }, // ring
  { mcp: 17, tip: 20 }, // pinky
]

// How far a fully-extended fingertip typically sits beyond its MCP joint,
// expressed as a multiple of the wrist-to-middle-MCP distance. Tuned by eye
// against typical hand proportions -- not physically exact, just "good enough"
// for a satisfying open/closed response.
const EXTENSION_REFERENCE = 1.15

function distance(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/**
 * Computes how "open" a hand is, from 0 (extended flat) to 1 (curled fist),
 * then returns 1 - openness so the result reads as "grip strength" (0 = open
 * hand, 1 = full fist).
 */
export function computeRawGrip(landmarks: Point3D[]): number {
  const wrist = landmarks[WRIST]
  const handScale = distance(wrist, landmarks[MIDDLE_MCP]) || 1

  const opennessValues = FINGER_JOINTS.map(({ mcp, tip }) => {
    const tipDist = distance(wrist, landmarks[tip])
    const mcpDist = distance(wrist, landmarks[mcp])
    const extension = (tipDist - mcpDist) / handScale
    return Math.min(Math.max(extension / EXTENSION_REFERENCE, 0), 1)
  })

  const avgOpenness = opennessValues.reduce((sum, v) => sum + v, 0) / opennessValues.length
  return 1 - avgOpenness
}

/**
 * Wraps computeRawGrip with frame-to-frame smoothing (exponential moving
 * average) so small tracking jitter doesn't make the object flicker.
 */
export function createGripTracker(smoothing = 0.35) {
  let smoothed = 0

  return {
    update(landmarks: Point3D[] | null): number {
      const target = landmarks ? computeRawGrip(landmarks) : 0
      smoothed = smoothed + (target - smoothed) * smoothing
      return smoothed
    },
    reset() {
      smoothed = 0
    },
  }
}

export interface HandBounds {
  /** Normalized 0..1 centroid position in the native (unmirrored) video frame. */
  x: number
  y: number
  /** Normalized radius (fraction of frame width) that comfortably encloses the hand. */
  radius: number
}

/** Centroid + spread of all 21 landmarks -- used to crop/zoom just the hand region. */
export function computeHandBounds(landmarks: Point3D[]): HandBounds {
  const centerX = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length
  const centerY = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length
  const radius = landmarks.reduce((max, p) => Math.max(max, Math.hypot(p.x - centerX, p.y - centerY)), 0)
  return { x: centerX, y: centerY, radius }
}

/** Smooths hand bounds across frames so the crop/zoom doesn't jitter. */
export function createBoundsTracker(smoothing = 0.25) {
  let smoothed: HandBounds | null = null

  return {
    update(landmarks: Point3D[] | null): HandBounds | null {
      if (!landmarks) {
        smoothed = null
        return null
      }
      const target = computeHandBounds(landmarks)
      if (!smoothed) {
        smoothed = target
      } else {
        smoothed = {
          x: smoothed.x + (target.x - smoothed.x) * smoothing,
          y: smoothed.y + (target.y - smoothed.y) * smoothing,
          radius: smoothed.radius + (target.radius - smoothed.radius) * smoothing,
        }
      }
      return smoothed
    },
  }
}
