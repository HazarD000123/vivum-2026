import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { Region } from './data'
import { computePoses, makeHeightField } from './regionMath'
import type { RegionNav } from './r3f/RegionRig'
import RegionScene from './r3f/RegionScene'
import RegionOverlay from './overlay/RegionOverlay'

// A category world: the same fixed-canvas architecture as the ascent, but
// navigation is travel, not scroll — clicking a landmark (in the world or on
// the route strip) flies the camera there, then the field log unfolds.

export type RegionPhase = 'intro' | 'overview' | 'travel' | 'arrived'

// Debug affordances (constant for the app's lifetime, like the ascent's
// ?fix=): ?snap makes every camera travel instant, ?loc=2 deep-links into a
// location's field log. Combine them for screenshots.
const PARAMS = new URLSearchParams(window.location.search)
const SNAP = PARAMS.has('snap')
const INIT_LOC = (() => {
  const v = PARAMS.get('loc')
  if (v === null) return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
})()

export default function RegionApp({ region, onReady }: { region: Region; onReady?: () => void }) {
  const field = useMemo(() => makeHeightField(region), [region])
  const poses = useMemo(() => computePoses(region, field), [region, field])
  const initLoc = INIT_LOC !== null && INIT_LOC < region.locations.length ? INIT_LOC : null
  const nav = useRef<RegionNav>({ seq: 0, target: initLoc, snap: SNAP }).current
  const [focusIdx, setFocusIdx] = useState<number | null>(initLoc)
  const [phase, setPhase] = useState<RegionPhase>('intro')

  const travelTo = (idx: number | null) => {
    if (idx === focusIdx && (phase === 'travel' || phase === 'arrived')) return
    if (idx === null && focusIdx === null) return
    nav.target = idx
    nav.seq++
    setFocusIdx(idx)
    setPhase('travel')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') travelTo(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const prev = document.title
    document.title = `${region.name} — VIVUM 2026 | The International School Bangalore`
    return () => {
      document.title = prev
    }
  }, [region])

  return (
    <>
      <div className="world">
        <Canvas
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          camera={{ fov: 55, near: 0.1, far: 2600, position: poses.intro.pos }}
          onCreated={() => {
            requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))
          }}
          onPointerMissed={() => {
            if (phase === 'arrived') travelTo(null)
          }}
        >
          <RegionScene
            region={region}
            field={field}
            poses={poses}
            nav={nav}
            focusIdx={focusIdx}
            onArrive={(idx) => setPhase(idx === null ? 'overview' : 'arrived')}
            onSelect={travelTo}
          />
        </Canvas>
      </div>

      <div className="grade-vignette" aria-hidden />
      <div className="grade-grain" aria-hidden />

      <RegionOverlay region={region} phase={phase} focusIdx={focusIdx} onTravel={travelTo} />
    </>
  )
}
