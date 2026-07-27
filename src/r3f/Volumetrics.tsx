import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey, remap } from '../journey'
import { makeBeamTexture, makeRadialTexture } from './textures'

// Restrained volumetric dressing: moonlight slabs falling through the night
// fog, a warm scattered glow where the sun breaks the horizon, and low fog
// sheets pooling in the valley. Every opacity here lives below ~0.1 — the
// moment a beam announces itself it has failed.

interface BeamSpec {
  pos: [number, number, number]
  scale: [number, number]
  tilt: number
  base: number
}

const MOON_BEAMS: BeamSpec[] = [
  { pos: [-46, 92, -176], scale: [42, 190], tilt: -0.52, base: 0.045 },
  { pos: [18, 104, -238], scale: [64, 230], tilt: -0.58, base: 0.06 },
  { pos: [72, 88, -150], scale: [34, 170], tilt: -0.5, base: 0.035 },
]

const SUN_BEAMS: BeamSpec[] = [
  { pos: [46, 150, -780], scale: [90, 320], tilt: 0.1, base: 0.05 },
  { pos: [110, 130, -760], scale: [60, 260], tilt: 0.22, base: 0.04 },
  { pos: [-20, 140, -800], scale: [70, 280], tilt: -0.06, base: 0.045 },
]

interface FogSheetSpec {
  pos: [number, number, number]
  scale: number
  base: number
  drift: number
}

const FOG_SHEETS: FogSheetSpec[] = [
  { pos: [-44, 6, -180], scale: 150, base: 0.06, drift: 1.0 },
  { pos: [50, 9, -250], scale: 190, base: 0.08, drift: 0.7 },
  { pos: [-20, 12, -330], scale: 220, base: 0.09, drift: 0.5 },
  { pos: [38, 8, -120], scale: 130, base: 0.05, drift: 1.3 },
]

export default function Volumetrics() {
  const moonBeams = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const sunBeams = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const sheets = useRef<(THREE.Mesh | null)[]>([])
  const sunGlow = useRef<THREE.SpriteMaterial>(null)

  const beamTex = useMemo(() => makeBeamTexture(), [])
  const sheetTex = useMemo(
    () =>
      makeRadialTexture(256, [
        [0, 'rgba(255,255,255,0.5)'],
        [0.5, 'rgba(255,255,255,0.22)'],
        [1, 'rgba(255,255,255,0)'],
      ]),
    [],
  )
  const glowTex = useMemo(() => makeRadialTexture(256), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Shafts need fog to scatter in: scale with fog presence.
    const fogNorm = THREE.MathUtils.clamp(atmo.fogDensity / 0.004, 0, 1.2)
    const moonI = atmo.stars * fogNorm
    moonBeams.current.forEach((mat, i) => {
      if (!mat) return
      mat.opacity = MOON_BEAMS[i].base * moonI * (0.8 + 0.2 * Math.sin(t * 0.13 + i * 2.4))
      mat.color.copy(atmo.dirLight)
    })
    sunBeams.current.forEach((mat, i) => {
      if (!mat) return
      mat.opacity = SUN_BEAMS[i].base * atmo.sun * (0.82 + 0.18 * Math.sin(t * 0.1 + i * 1.9))
      mat.color.copy(atmo.dirLight)
    })
    if (sunGlow.current) {
      // Keep the horizon glow polite while the summit text is up.
      const contentDim = 1 - 0.45 * remap(journey.p, 0.875, 0.94)
      sunGlow.current.opacity = atmo.sun * 0.16 * contentDim
      sunGlow.current.color.copy(atmo.dirLight)
    }
    // Valley fog sheets: pool in the lowlands, breathe, drift.
    const sheetI = THREE.MathUtils.clamp(atmo.fogDensity / 0.0045, 0.3, 1.3)
    sheets.current.forEach((mesh, i) => {
      if (!mesh) return
      const spec = FOG_SHEETS[i]
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = spec.base * sheetI * (0.85 + 0.15 * Math.sin(t * 0.08 * spec.drift + i * 3.1))
      mat.color.copy(atmo.fog).lerp(atmo.skyHorizon, 0.4).multiplyScalar(1.25)
      mesh.position.x = spec.pos[0] + Math.sin(t * 0.04 * spec.drift + i * 1.8) * 14
    })
  })

  return (
    <group>
      {MOON_BEAMS.map((b, i) => (
        <mesh key={`m${i}`} position={b.pos} rotation={[0, 0, b.tilt]}>
          <planeGeometry args={b.scale} />
          <meshBasicMaterial
            ref={(m) => (moonBeams.current[i] = m)}
            map={beamTex}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}

      {SUN_BEAMS.map((b, i) => (
        <mesh key={`s${i}`} position={b.pos} rotation={[0, 0, b.tilt]}>
          <planeGeometry args={b.scale} />
          <meshBasicMaterial
            ref={(m) => (sunBeams.current[i] = m)}
            map={beamTex}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}

      {/* Scattered atmosphere over the rising sun — not a lens flare. */}
      <sprite position={[80, 60, -860]} scale={[420, 230, 1]}>
        <spriteMaterial ref={sunGlow} map={glowTex} transparent opacity={0} depthWrite={false} fog={false} />
      </sprite>

      {FOG_SHEETS.map((spec, i) => (
        <mesh
          key={`f${i}`}
          ref={(m) => (sheets.current[i] = m)}
          position={spec.pos}
          rotation={[-Math.PI / 2, 0, i * 1.3]}
        >
          <planeGeometry args={[spec.scale, spec.scale * 0.7]} />
          <meshBasicMaterial map={sheetTex} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  )
}
