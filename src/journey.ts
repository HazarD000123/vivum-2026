import * as THREE from 'three'

// ---------------------------------------------------------------------------
// The journey: scroll progress p ∈ [0,1] maps to physical progress up the
// mountain. Everything — camera, weather, light, overlays — keys off p.
// ---------------------------------------------------------------------------

export interface Stage {
  id: string
  name: string
  from: number
  to: number
  alt: string
}

export const STAGES: Stage[] = [
  { id: 'arrival',    name: 'The Arrival',    from: 0.0,  to: 0.10, alt: '1 240 M' },
  { id: 'basecamp',   name: 'Base Camp',      from: 0.10, to: 0.28, alt: '1 950 M' },
  { id: 'valley',     name: 'The Valley',     from: 0.28, to: 0.50, alt: '3 210 M' },
  { id: 'expedition', name: 'The Expedition', from: 0.50, to: 0.68, alt: '4 380 M' },
  { id: 'ridge',      name: 'The Ice Ridge',  from: 0.68, to: 0.86, alt: '5 120 M' },
  { id: 'summit',     name: 'The Summit',     from: 0.86, to: 1.0,  alt: '5 642 M' },
]

// Shared mutable state — written once per scroll event, read in useFrame.
export const journey = {
  p: 0,
  scrollTo: null as ((p: number) => void) | null,
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const remap = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const altitudeAt = (p: number) => Math.round(1240 + (5642 - 1240) * p)

export function stageIndexAt(p: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].from) return i
  return 0
}

// ---------------------------------------------------------------------------
// Atmosphere timeline — night → camp → pre-dawn valley → storm → clearing
// ridge → sunrise summit. Sampled every frame into a reused Atmo object.
// ---------------------------------------------------------------------------

export interface Atmo {
  skyTop: THREE.Color
  skyHorizon: THREE.Color
  fog: THREE.Color
  dirLight: THREE.Color
  dirIntensity: number
  ambIntensity: number
  fogDensity: number
  snow: number
  stars: number
  aurora: number
  sun: number
}

interface AtmoKey {
  p: number
  skyTop: THREE.Color
  skyHorizon: THREE.Color
  fog: THREE.Color
  dirLight: THREE.Color
  dirIntensity: number
  ambIntensity: number
  fogDensity: number
  snow: number
  stars: number
  aurora: number
  sun: number
}

const key = (
  p: number, skyTop: string, skyHorizon: string, fog: string, dirLight: string,
  dirIntensity: number, ambIntensity: number, fogDensity: number,
  snow: number, stars: number, aurora: number, sun: number,
): AtmoKey => ({
  p,
  skyTop: new THREE.Color(skyTop),
  skyHorizon: new THREE.Color(skyHorizon),
  fog: new THREE.Color(fog),
  dirLight: new THREE.Color(dirLight),
  dirIntensity, ambIntensity, fogDensity, snow, stars, aurora, sun,
})

// Graded for cinema: crushed shadows, desaturated alpine cools, a muted
// sunrise. The aurora never exceeds 0.65 — it supports, it doesn't star.
const KEYS: AtmoKey[] = [
  //   p     skyTop     horizon    fog        dirLight   dirI  amb   fogD    snow stars aur  sun
  key(0.00, '#02040a', '#0d1626', '#070e1a', '#88a8dc', 0.50, 0.22, 0.0042, 0.30, 1.00, 0, 0),
  key(0.14, '#030610', '#111c30', '#0a1322', '#8cabdd', 0.52, 0.25, 0.0040, 0.28, 0.95, 0, 0),
  key(0.30, '#061022', '#1e3050', '#16263e', '#9ab4dd', 0.58, 0.32, 0.0034, 0.25, 0.60, 0, 0),
  key(0.48, '#1c2839', '#44546a', '#38485c', '#a8b8cc', 0.55, 0.42, 0.0060, 0.80, 0.10, 0, 0),
  key(0.60, '#232f42', '#525f72', '#45556a', '#aab9cc', 0.50, 0.45, 0.0102, 1.00, 0.00, 0, 0),
  key(0.74, '#0e1c38', '#7791b2', '#6e8aa8', '#d4e2f4', 0.85, 0.50, 0.0034, 0.45, 0.12, 0.12, 0),
  key(0.86, '#131a33', '#b06a4a', '#8a7a90', '#f4c896', 1.00, 0.52, 0.0017, 0.15, 0.30, 0.40, 0.5),
  key(1.00, '#161e3c', '#d08a5e', '#a98b94', '#f6bd84', 1.15, 0.56, 0.0012, 0.12, 0.26, 0.65, 1.0),
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const atmo: Atmo = {
  skyTop: new THREE.Color(),
  skyHorizon: new THREE.Color(),
  fog: new THREE.Color(),
  dirLight: new THREE.Color(),
  dirIntensity: 0.4,
  ambIntensity: 0.3,
  fogDensity: 0.0042,
  snow: 0.35,
  stars: 1,
  aurora: 0,
  sun: 0,
}

export function sampleAtmo(p: number, out: Atmo = atmo): Atmo {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = clamp01((p - a.p) / (b.p - a.p))
  out.skyTop.lerpColors(a.skyTop, b.skyTop, t)
  out.skyHorizon.lerpColors(a.skyHorizon, b.skyHorizon, t)
  out.fog.lerpColors(a.fog, b.fog, t)
  out.dirLight.lerpColors(a.dirLight, b.dirLight, t)
  out.dirIntensity = lerp(a.dirIntensity, b.dirIntensity, t)
  out.ambIntensity = lerp(a.ambIntensity, b.ambIntensity, t)
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t)
  out.snow = lerp(a.snow, b.snow, t)
  out.stars = lerp(a.stars, b.stars, t)
  out.aurora = lerp(a.aurora, b.aurora, t)
  out.sun = lerp(a.sun, b.sun, t)
  return out
}
