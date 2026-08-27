export type SquishStyle = 'elastic' | 'plastic' | 'rigid'
export type ParticleKind = 'smoke' | 'spark' | 'dust' | 'droplet' | 'splinter' | 'sand' | 'crack' | null

export interface MaterialConfig {
  id: string
  label: string
  emoji: string
  /** Base CSS gradient -- used as a fallback while `image` loads, and if `image` is omitted. */
  background: string
  /**
   * Imported artwork (a Vite asset URL) for the ball itself -- a
   * transparent-background sphere render. When present, this replaces
   * `background`/`pattern` as the ball's visual; `background` still shows
   * briefly while the image loads.
   */
  image?: string
  /**
   * Extra CSS background-image layer(s) painted above `background` to give
   * the ball its material texture (bubble-wrap dots, wood rings, brick
   * lines, etc). Comma-separate multiple layers here. Ignored when `image`
   * is set.
   */
  pattern?: string
  /**
   * background-size for exactly the layers listed in `pattern` (same
   * comma count). Leave unset for patterns that already fill the box on
   * their own (repeating-radial/conic/linear gradients).
   */
  patternSize?: string
  /** 0 = squishes very easily (water), 1 = barely deforms (brick). */
  resistance: number
  squishStyle: SquishStyle
  /** Called on every grip-closing edge (open -> closed transition). */
  playSound: (grip: number) => void
  particle: ParticleKind
  /** Only trigger the particle burst once grip passes this threshold. */
  particleThreshold?: number
  /** Shrinks a little every squeeze, like a real snowball. */
  consumable?: boolean
}
