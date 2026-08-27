// Shared synthesis primitives + one tuned sound per material. Everything is
// generated with the Web Audio API -- no external sound files. Every call
// randomizes pitch/timing slightly so repeated squeezes don't sound identical.

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!audioCtx) audioCtx = new AudioCtx()
  return audioCtx
}

function jitter(base: number, amount: number): number {
  return base * (1 + (Math.random() * 2 - 1) * amount)
}

interface NoiseBurstOptions {
  duration: number
  filterType?: BiquadFilterType
  freqStart: number
  freqEnd?: number
  q?: number
  gain?: number
}

function playNoiseBurst({ duration, filterType = 'bandpass', freqStart, freqEnd, q = 1, gain = 0.3 }: NoiseBurstOptions) {
  const ctx = getContext()
  if (!ctx) return

  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.setValueAtTime(freqStart, ctx.currentTime)
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration)
  filter.Q.value = q

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(gain, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  noise.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + duration)
}

interface ToneOptions {
  duration: number
  freqStart: number
  freqEnd: number
  type?: OscillatorType
  gain?: number
  delay?: number
}

function playTone({ duration, freqStart, freqEnd, type = 'sine', gain = 0.25, delay = 0 }: ToneOptions) {
  const ctx = getContext()
  if (!ctx) return

  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, start)
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + duration)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(gain, start)
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration)

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration)
}

// ---- Per-material sounds ----

export function playWaxBubble() {
  playNoiseBurst({ duration: 0.1, filterType: 'bandpass', freqStart: jitter(3400, 0.15), q: 6, gain: 0.35 })
  playTone({ duration: 0.04, freqStart: jitter(800, 0.1), freqEnd: 200, type: 'sine', gain: 0.2 })
}

export function playGlobe() {
  playNoiseBurst({ duration: 0.25, filterType: 'lowpass', freqStart: jitter(750, 0.1), freqEnd: 500, q: 1, gain: 0.3 })
  playTone({ duration: 0.15, freqStart: jitter(100, 0.15), freqEnd: 60, type: 'sine', gain: 0.25 })
}

export function playOrange(grip: number) {
  playNoiseBurst({ duration: 0.18, filterType: 'lowpass', freqStart: jitter(500, 0.15), q: 0.8, gain: 0.28 })
  if (grip > 0.85) {
    playNoiseBurst({ duration: 0.08, filterType: 'bandpass', freqStart: jitter(2200, 0.2), q: 3, gain: 0.12 })
  }
}

export function playWater() {
  playNoiseBurst({ duration: 0.3, filterType: 'lowpass', freqStart: jitter(1200, 0.2), freqEnd: 400, q: 0.7, gain: 0.25 })
  playTone({ duration: 0.2, freqStart: jitter(300, 0.2), freqEnd: 150, type: 'sine', gain: 0.15, delay: 0.05 })
}

export function playSand() {
  for (let i = 0; i < 4; i++) {
    playNoiseBurst({
      duration: 0.06,
      filterType: 'highpass',
      freqStart: jitter(2500, 0.3),
      q: 0.5,
      gain: 0.12,
    })
  }
}

export function playWood(grip: number) {
  if (grip > 0.9) {
    playNoiseBurst({ duration: 0.12, filterType: 'bandpass', freqStart: jitter(1500, 0.2), q: 4, gain: 0.4 })
    playTone({ duration: 0.08, freqStart: jitter(400, 0.15), freqEnd: 120, type: 'sawtooth', gain: 0.2 })
  } else {
    playNoiseBurst({ duration: 0.05, filterType: 'highpass', freqStart: jitter(1800, 0.15), q: 1, gain: 0.08 })
  }
}

export function playToxicGas() {
  playNoiseBurst({ duration: 0.35, filterType: 'lowpass', freqStart: jitter(900, 0.2), freqEnd: 300, q: 0.6, gain: 0.28 })
  playTone({ duration: 0.3, freqStart: jitter(180, 0.2), freqEnd: 90, type: 'triangle', gain: 0.1 })
}

export function playStatic() {
  const ctx = getContext()
  if (ctx) {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    const start = ctx.currentTime
    const dur = 0.15
    osc.frequency.setValueAtTime(jitter(220, 0.3), start)
    for (let i = 0; i < 8; i++) {
      osc.frequency.linearRampToValueAtTime(jitter(60 + Math.random() * 400, 0.4), start + (i / 8) * dur)
    }
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.15, start)
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + dur)
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + dur)
  }
  playNoiseBurst({ duration: 0.1, filterType: 'highpass', freqStart: jitter(4000, 0.2), q: 2, gain: 0.15 })
}

export function playSlime() {
  playNoiseBurst({ duration: 0.22, filterType: 'lowpass', freqStart: jitter(550, 0.2), q: 1.2, gain: 0.3 })
  playTone({ duration: 0.18, freqStart: jitter(250, 0.25), freqEnd: 180, type: 'sine', gain: 0.12, delay: 0.03 })
}

export function playSnowball() {
  for (let i = 0; i < 3; i++) {
    playNoiseBurst({
      duration: 0.05,
      filterType: 'bandpass',
      freqStart: jitter(2800, 0.25),
      q: 2,
      gain: 0.18,
    })
  }
}

export function playBrick() {
  playNoiseBurst({ duration: 0.2, filterType: 'bandpass', freqStart: jitter(900, 0.2), q: 0.4, gain: 0.32 })
  playNoiseBurst({ duration: 0.08, filterType: 'highpass', freqStart: jitter(3000, 0.2), q: 1, gain: 0.15 })
}
