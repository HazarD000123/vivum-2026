// Deterministic procedural terrain shared by the mesh, the camera rig and
// every prop that has to sit on the ground.

const fract = (x: number) => x - Math.floor(x)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function hash(ix: number, iz: number) {
  return fract(Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123)
}

function vnoise(x: number, z: number) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz)
  const b = hash(ix + 1, iz)
  const c = hash(ix, iz + 1)
  const d = hash(ix + 1, iz + 1)
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz
}

export function fbm(x: number, z: number) {
  let v = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < 4; i++) {
    v += amp * vnoise(x * freq, z * freq)
    freq *= 2.13
    amp *= 0.5
  }
  return v
}

// Ridged multifractal — sharp arêtes and couloirs. Crests carry more detail
// than basins (Musgrave weighting), which is what real eroded rock does.
export function ridged(x: number, z: number) {
  let v = 0
  let amp = 0.5
  let freq = 1
  let w = 1
  for (let i = 0; i < 5; i++) {
    let n = 1 - Math.abs(2 * vnoise(x * freq, z * freq) - 1)
    n = n * n * w
    w = clamp(n * 1.6, 0, 1)
    v += n * amp
    freq *= 2.07
    amp *= 0.5
  }
  return clamp(v, 0, 1)
}

// The trail runs from z = Z_START (arrival) to z = Z_END (summit plateau).
export const Z_START = 12
export const Z_END = -540
export const PATH_LEN = Z_START - Z_END

export const ascentT = (z: number) => clamp((Z_START - z) / PATH_LEN, 0, 1)

export function trailHeight(z: number) {
  const t = ascentT(z)
  let h = 96 * Math.pow(t, 1.55) + 2.2 * Math.sin(z * 0.045)
  // Past the plateau the land falls away so the summit overlooks open sky.
  const u = clamp((-580 - z) / 150, 0, 1)
  h -= 88 * u * u * (3 - 2 * u)
  return h
}

export function terrainHeight(x: number, z: number) {
  const t = ascentT(z)
  const corridor = lerp(46, 12, t)
  const side = smooth(corridor, corridor + 55, Math.abs(x))
  const opening = smooth(0, 1, clamp((-560 - z) / 180, 0, 1))
  const amp = (26 + 74 * t) * (1 - 0.85 * opening)

  // Domain warp: low-frequency offset so ridgelines flow and bend instead of
  // repeating on a grid — glacier-carved forms rather than uniform bumps.
  const wx = fbm(x * 0.011 + 21.4, z * 0.011 + 4.8) * 36
  const wz = fbm(x * 0.011 - 8.2, z * 0.011 + 17.3) * 36

  const ridge = ridged((x + wx) * 0.016, (z + wz) * 0.016)
  const detail = fbm(x * 0.06 + 3.7, z * 0.06 + 9.2)
  const m = (Math.pow(ridge, 1.45) * 0.85 + (detail - 0.45) * 0.22) * amp

  const wall =
    smooth(150, 300, Math.abs(x)) *
    (60 + 150 * ridged((x + wx * 0.6) * 0.006 + 5.0, (z + wz * 0.6) * 0.006))
  const wallFade = 1 - 0.6 * smooth(0, 1, clamp((-560 - z) / 220, 0, 1))
  return trailHeight(z) + side * m + wall * wallFade
}

// Progress p ∈ [0,1] → world z along the trail.
export const zAt = (p: number) => Z_START - PATH_LEN * p
