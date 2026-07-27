import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { terrainHeight } from '../terrainMath'
import { makeRadialTexture } from '../textures'
import { useLeopardBehaviour } from './useLeopardBehaviour'
import ProceduralLeopard from './ProceduralLeopard'
import GlbLeopard from './GlbLeopard'

// ---------------------------------------------------------------------------
// The Summit Guardian.
//
// After the whole ascent through its world — the eyes in the dark, the tracks
// in the snow — the snow leopard is finally met in full at the top: perched on
// a ledge at the edge of the plateau, overlooking the cloud sea, backlit by the
// sunrise. It sits off to the right so the title and countdown stay primary,
// and it gathers out of the dawn light a beat after the summit lands, so the
// climber discovers it rather than being shown it.
//
// One behaviour brain drives whichever body is present — the in-engine sculpt
// by default, or a rigged `/leopard.glb` the moment one is dropped in.
// ---------------------------------------------------------------------------

// The perch: out on the right shoulder of the plateau, where the land falls
// away into open sky. Tuned to frame in the lower-right at the summit.
const PERCH_X = 22
const PERCH_Z = -587
const FACING = -1.78 // radians: near-profile, gazing out over the valley
const SCALE = 0.95
const SEAT_RISE = 3.0 // height of the ledge top above the local terrain

function Outcrop() {
  // A snow-dusted granite ledge rising out of the slope to a flat seat at
  // y = SEAT_RISE, in the flat-shaded idiom of the cairns and the summit stone
  // so it belongs to the same mountain. Rooted at local ground (y = 0).
  const rock = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#59647a', roughness: 1, flatShading: true }),
    [],
  )
  const cap = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cdd9ec', roughness: 1, flatShading: true }),
    [],
  )
  const H = SEAT_RISE + 5 // the mass sinks well into the slope below
  const cy = SEAT_RISE - H / 2
  return (
    <group>
      {/* Core mass, canted so no face reads as a clean wall */}
      <mesh material={rock} position={[0, cy, 0]} rotation={[0.16, 0.4, 0.13]}>
        <boxGeometry args={[6.6, H, 5.6]} />
      </mesh>
      {/* Buttressing shards breaking up the silhouette */}
      <mesh material={rock} position={[3.1, cy - 0.4, 1.7]} rotation={[0.22, -0.35, -0.34]}>
        <boxGeometry args={[3.0, H, 2.8]} />
      </mesh>
      <mesh material={rock} position={[-2.9, cy - 0.2, -1.5]} rotation={[-0.18, 0.7, 0.4]}>
        <boxGeometry args={[2.8, H, 3.2]} />
      </mesh>
      <mesh material={rock} position={[1.4, SEAT_RISE - 1.1, 2.6]} rotation={[0.5, 0.2, 0.22]}>
        <boxGeometry args={[2.4, 3.0, 2.0]} />
      </mesh>
      {/* A back spire and a lower shelf stepping toward the valley edge */}
      <mesh material={rock} position={[-1.8, SEAT_RISE + 0.6, -2.2]} rotation={[0.24, -0.4, 0.5]}>
        <boxGeometry args={[1.8, 3.4, 1.6]} />
      </mesh>
      <mesh material={rock} position={[-3.8, SEAT_RISE - 2.7, 2.8]} rotation={[0.2, 0.2, -0.42]}>
        <boxGeometry args={[3.0, 3.0, 3.0]} />
      </mesh>
      {/* Snow gathered on the broken top — the seat, plus a couple of drifts */}
      <mesh material={cap} position={[0.3, SEAT_RISE - 0.25, 0.2]} rotation={[0.1, 0.4, 0.06]}>
        <boxGeometry args={[5.2, 0.5, 4.2]} />
      </mesh>
      <mesh material={cap} position={[-3.6, SEAT_RISE - 2.55, 2.9]} rotation={[0.2, 0.2, -0.42]}>
        <boxGeometry args={[2.6, 0.4, 2.6]} />
      </mesh>
    </group>
  )
}

function PawTrail({ toX, toZ }: { toX: number; toZ: number }) {
  // The tracks resolve one last time — climbing the snow to the ledge, the
  // soft dark impressions the field note promised back at base camp.
  const tex = useMemo(
    () =>
      makeRadialTexture(64, [
        [0, 'rgba(20,26,40,0.55)'],
        [0.5, 'rgba(20,26,40,0.28)'],
        [1, 'rgba(20,26,40,0)'],
      ]),
    [],
  )
  const prints = useMemo(() => {
    const list: Array<{ x: number; z: number; o: number }> = []
    const fromX = toX - 14
    const fromZ = toZ + 26
    const steps = 7
    for (let i = 0; i < steps; i++) {
      const u = i / (steps - 1)
      const side = i % 2 === 0 ? 0.7 : -0.7
      const x = fromX + (toX - fromX) * u + side
      const z = fromZ + (toZ - fromZ) * u
      list.push({ x, z, o: 0.1 + u * 0.16 }) // fresher (darker) nearer the ledge
    }
    return list
  }, [toX, toZ])

  return (
    <group>
      {prints.map(({ x, z, o }, i) => (
        <mesh
          key={i}
          position={[x, terrainHeight(x, z) + 0.06, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.1, 1.6, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={o} />
        </mesh>
      ))}
    </group>
  )
}

function detectGlb(src: string): Promise<boolean> {
  return fetch(src, { method: 'HEAD' })
    .then((res) => {
      if (!res.ok) return false
      // Dev servers answer missing routes with the SPA index.html; reject that.
      const type = res.headers.get('content-type') ?? ''
      return !type.includes('text/html')
    })
    .catch(() => false)
}

export default function SummitLeopard({ src = '/leopard.glb' }: { src?: string }) {
  const { state, update } = useLeopardBehaviour()
  const [useGlb, setUseGlb] = useState(false)

  useEffect(() => {
    let alive = true
    detectGlb(src).then((ok) => {
      if (alive) setUseGlb(ok)
    })
    return () => {
      alive = false
    }
  }, [src])

  const groundY = useMemo(() => terrainHeight(PERCH_X, PERCH_Z), [])
  const seatY = groundY + SEAT_RISE // the cat's feet rest on the ledge top

  return (
    <group>
      <group position={[PERCH_X, groundY, PERCH_Z]}>
        <Outcrop />
      </group>
      <PawTrail toX={PERCH_X} toZ={PERCH_Z} />
      <group position={[PERCH_X, seatY, PERCH_Z]} rotation={[0, FACING, 0]} scale={SCALE}>
        {useGlb ? (
          <Suspense fallback={<ProceduralLeopard state={state} update={update} />}>
            <GlbLeopard src={src} state={state} update={update} />
          </Suspense>
        ) : (
          <ProceduralLeopard state={state} update={update} />
        )}
      </group>
    </group>
  )
}
