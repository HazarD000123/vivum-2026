import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeRadialTexture } from '../../r3f/textures'
import { LAKE } from '../regionMath'
import type { HeightField } from '../regionMath'
import type { Region } from '../data'

// Per-region environmental dressing: the lit route between landmarks, the
// frozen lake and its mist in the basin, drifting lantern-light in the valley.

let _dotTex: THREE.Texture | null = null
const dotTex = () => (_dotTex ??= makeRadialTexture(64))

/* ------------------------------------------------------------------ */
/*  Route lights — the trail of small fires linking every landmark     */
/* ------------------------------------------------------------------ */

export function LightTrail({ region, field }: { region: Region; field: HeightField }) {
  const mat = useRef<THREE.PointsMaterial>(null)

  const geometry = useMemo(() => {
    const pts: number[] = []
    let px = 0
    let pz = 24
    let seed = 3
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (const l of region.locations) {
      const seg = Math.hypot(l.x - px, l.z - pz)
      const n = Math.max(8, Math.round(seg / 7))
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1)
        const x = px + (l.x - px) * t + (rand() - 0.5) * 3
        const z = pz + (l.z - pz) * t + (rand() - 0.5) * 3
        pts.push(x, field(x, z) + 0.5, z)
      }
      px = l.x
      pz = l.z
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
    return geo
  }, [region, field])

  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.42 + 0.14 * Math.sin(clock.elapsedTime * 0.8)
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={mat}
        map={dotTex()}
        color={region.theme.accent}
        size={0.85}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/*  The frozen lake — basin regions only                               */
/* ------------------------------------------------------------------ */

export function FrozenLake() {
  return (
    <mesh position={[LAKE.x, LAKE.y + 0.08, LAKE.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[LAKE.r + 26, 64]} />
      <meshStandardMaterial
        color="#2a405e"
        roughness={0.3}
        metalness={0.2}
        emissive="#16304a"
        emissiveIntensity={0.55}
      />
    </mesh>
  )
}

export function LakeMist() {
  const group = useRef<THREE.Group>(null)
  const tex = useMemo(() => makeRadialTexture(128), [])
  const specs = useMemo(() => {
    const list: Array<{ x: number; z: number; s: number; o: number; v: number }> = []
    let seed = 11
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 8; i++) {
      const a = rand() * Math.PI * 2
      const r = rand() * LAKE.r * 0.9
      list.push({
        x: LAKE.x + Math.cos(a) * r,
        z: LAKE.z + Math.sin(a) * r,
        s: 46 + rand() * 50,
        o: 0.045 + rand() * 0.05,
        v: 0.3 + rand() * 0.7,
      })
    }
    return list
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.children.forEach((child, i) => {
      const spec = specs[i]
      const sprite = child as THREE.Sprite
      sprite.position.x = spec.x + Math.sin(t * 0.05 * spec.v + i * 2.3) * 14
      const mat = sprite.material as THREE.SpriteMaterial
      mat.opacity = spec.o * (0.8 + 0.2 * Math.sin(t * 0.16 * spec.v + i))
    })
  })

  return (
    <group ref={group}>
      {specs.map((spec, i) => (
        <sprite key={i} position={[spec.x, LAKE.y + 4.5, spec.z]} scale={[spec.s, spec.s * 0.32, 1]}>
          <spriteMaterial map={tex} color="#9db4d6" transparent opacity={spec.o} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Lantern light adrift in the valley — events region only            */
/* ------------------------------------------------------------------ */

const LANTERN_COUNT = 110

export function Lanterns({ region, field }: { region: Region; field: HeightField }) {
  const points = useRef<THREE.Points>(null)

  const { geometry, base, seeds } = useMemo(() => {
    const positions = new Float32Array(LANTERN_COUNT * 3)
    const base = new Float32Array(LANTERN_COUNT * 3)
    const seeds = new Float32Array(LANTERN_COUNT)
    let seed = 29
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < LANTERN_COUNT; i++) {
      // Lanterns gather near the camps rather than spreading uniformly.
      const loc = region.locations[i % region.locations.length]
      const x = loc.x + (rand() - 0.5) * 56
      const z = loc.z + (rand() - 0.5) * 56
      base[i * 3] = x
      base[i * 3 + 1] = field(x, z) + 1.5
      base[i * 3 + 2] = z
      positions[i * 3] = x
      positions[i * 3 + 1] = base[i * 3 + 1]
      positions[i * 3 + 2] = z
      seeds[i] = rand() * 100
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, base, seeds }
  }, [region, field])

  useFrame(({ clock }) => {
    if (!points.current) return
    const t = clock.elapsedTime
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < LANTERN_COUNT; i++) {
      const i3 = i * 3
      const rise = (t * (0.55 + (seeds[i] % 1) * 0.6) + seeds[i] * 7) % 20
      arr[i3] = base[i3] + Math.sin(t * 0.3 + seeds[i]) * 2.2
      arr[i3 + 1] = base[i3 + 1] + rise
      arr[i3 + 2] = base[i3 + 2] + Math.cos(t * 0.22 + seeds[i] * 1.7) * 1.8
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={dotTex()}
        color="#ffb877"
        size={0.55}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  )
}
