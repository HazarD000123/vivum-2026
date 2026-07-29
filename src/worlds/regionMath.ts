import { fbm, ridged } from '../r3f/terrainMath'
import type { Region } from './data'

// ---------------------------------------------------------------------------
// Each region is its own heightfield, built from the same noise vocabulary as
// the main ascent so the ranges feel related:
//   valley — a sheltered bowl that climbs gently away from the entrance
//   ridge  — sharp ridged terrain where every location sits on its own peak
//   basin  — a dead-flat frozen lake ringed by soft hills
// Landing pads are flattened around every location so landmarks sit cleanly.
// ---------------------------------------------------------------------------

export type HeightField = (x: number, z: number) => number

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth01 = (v: number) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

export const LAKE = { x: 0, z: -190, r: 150, y: -2 }

export function makeHeightField(region: Region): HeightField {
  const kind = region.theme.terrain
  const locs = region.locations

  // Ridge regions: summit height climbs with the location index — the last
  // competition is the highest peak on the crucible.
  const peakH = (i: number) => 16 + i * 6

  const raw = (x: number, z: number): number => {
    // Containment walls shared by every region — the world reads as a basin
    // in a larger range, with DistantRanges and the sky beyond.
    const wx = smooth01((Math.abs(x) - 230) / 150)
    const wFar = smooth01((-z - 400) / 160)
    const wNear = smooth01((z - 70) / 90)
    const wallT = Math.max(wx, Math.max(wFar, wNear))
    const wall = wallT * wallT * (70 + 130 * ridged(x * 0.006 + 9.1, z * 0.006 + 3.7))

    if (kind === 'valley') {
      const bowl = Math.pow(Math.abs(x) / 160, 2) * 30
      const roll = (fbm(x * 0.022 + 3.1, z * 0.022 + 7.7) - 0.5) * 16
      const rim = smooth01((Math.abs(x) - 110) / 110) * ridged(x * 0.009 + 11.2, z * 0.009 + 5.4) * 34
      const rise = -z * 0.045
      return -6 + bowl + roll + rim + rise + wall
    }

    if (kind === 'ridge') {
      const r = ridged(x * 0.012 + 21.3, z * 0.012 + 9.8)
      const rough = Math.pow(r, 1.35) * 42
      const chop = (fbm(x * 0.055 + 1.2, z * 0.055 + 6.3) - 0.5) * 9
      const rise = -z * 0.1
      let h = -8 + rough + chop + rise + wall
      for (let i = 0; i < locs.length; i++) {
        const dx = x - locs[i].x
        const dz = z - locs[i].z
        h += peakH(i) * Math.exp(-(dx * dx + dz * dz) / (30 * 30))
      }
      return h
    }

    // basin
    const dx = x - LAKE.x
    const dz = z - LAKE.z
    const d = Math.sqrt(dx * dx + dz * dz)
    const shore = smooth01((d - LAKE.r) / 110)
    const hills =
      shore *
      ((fbm(x * 0.018 + 5.5, z * 0.018 + 2.2) - 0.3) * 18 +
        ridged(x * 0.0075 + 3.3, z * 0.0075 + 8.8) * 30)
    return LAKE.y + shore * 5 + hills + wall
  }

  // Flatten a landing pad around each location so props sit on level ground.
  const padR = kind === 'ridge' ? 9 : 13
  const pads = locs.map((l) => ({ x: l.x, z: l.z, y: raw(l.x, l.z) }))

  return (x: number, z: number) => {
    let h = raw(x, z)
    for (const p of pads) {
      const dx = x - p.x
      const dz = z - p.z
      const w = Math.exp(-(dx * dx + dz * dz) / (padR * padR))
      h += (p.y - h) * w
    }
    return h
  }
}

// ---------------------------------------------------------------------------
// Camera poses — one overlook for the whole region, one cinematic approach
// pose per location, and a high entry pose the camera descends from on mount.
// ---------------------------------------------------------------------------

export interface Pose {
  pos: [number, number, number]
  look: [number, number, number]
}

export interface RegionPoses {
  intro: Pose
  overview: Pose
  locations: Pose[]
}

export function computePoses(region: Region, field: HeightField): RegionPoses {
  const locs = region.locations
  let maxY = -Infinity
  let cx = 0
  let cy = 0
  let cz = 0
  for (const l of locs) {
    const y = field(l.x, l.z)
    maxY = Math.max(maxY, y)
    cx += l.x / locs.length
    cy += y / locs.length
    cz += l.z / locs.length
  }

  const ovZ = 58
  const ovY = Math.max(field(0, ovZ) + 20, maxY + 15)
  // Gaze rides a little high so the frame holds peaks and sky, not just floor.
  const overview: Pose = { pos: [0, ovY, ovZ], look: [cx * 0.5, cy * 0.6 + 12, cz] }
  const intro: Pose = {
    pos: [cx * 0.3, ovY + 75, ovZ + 175],
    look: [cx * 0.5, cy * 0.6 + 12, cz],
  }

  const locations = locs.map((l) => {
    const gy = field(l.x, l.z)
    // Approach along the line from the overlook, stopping short of the
    // landmark; the look point shifts a touch screen-right so the landmark
    // sits left of centre, clear of the field-log panel.
    const dx = l.x
    const dz = l.z - ovZ
    const len = Math.hypot(dx, dz) || 1
    const fx = dx / len
    const fz = dz / len
    const back = region.theme.terrain === 'ridge' ? 30 : 26
    const px = l.x - fx * back
    const pz = l.z - fz * back
    const py = Math.max(field(px, pz) + 4.5, gy + 6.5)
    return {
      pos: [px, py, pz],
      look: [l.x + -fz * 4, gy + 3.2, l.z + fx * 4],
    } as Pose
  })

  return { intro, overview, locations }
}
