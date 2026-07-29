import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo } from '../journey'
import { makeRadialTexture } from './textures'

// Three layers of weather: near flakes (big, slow, parallax), far flakes
// (small, dense, reads as depth), and spindrift — ice dust ripped along the
// ground when the wind gusts. One shared gust model drives all of them so
// the whole scene leans together.

// Smooth, occasional gusts: mostly calm, sometimes a surge.
function gustAt(t: number) {
  const g = Math.sin(t * 0.21) * Math.sin(t * 0.131 + 1.7) * Math.sin(t * 0.073 + 0.4)
  return Math.pow(Math.max(0, g), 2) * 3.2
}

interface LayerSpec {
  count: number
  box: { x: number; y: number; z: number }
  size: number
  opacity: number
  fall: number
  wind: number
  yOffset: number
  spindrift?: boolean
}

function SnowLayer({ spec }: { spec: LayerSpec }) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.PointsMaterial>(null)

  const { geometry, seeds } = useMemo(() => {
    const positions = new Float32Array(spec.count * 3)
    const seeds = new Float32Array(spec.count)
    for (let i = 0; i < spec.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spec.box.x
      positions[i * 3 + 1] = (Math.random() - 0.5) * spec.box.y
      positions[i * 3 + 2] = (Math.random() - 0.5) * spec.box.z
      seeds[i] = Math.random() * Math.PI * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, seeds }
  }, [spec])

  const flake = useMemo(() => makeRadialTexture(64), [])

  useFrame(({ camera, clock }, rawDt) => {
    if (!points.current || !material.current) return
    points.current.position.set(
      camera.position.x,
      camera.position.y + spec.yOffset,
      camera.position.z,
    )

    const t = clock.elapsedTime
    const gust = gustAt(t)
    const snow = atmo.snow

    if (spec.spindrift) {
      // Spindrift only lives in real wind: storm and the exposed ridge.
      const drive = THREE.MathUtils.smoothstep(snow, 0.3, 0.9)
      material.current.opacity = spec.opacity * drive * (0.35 + 0.65 * Math.min(1, gust))
    } else {
      material.current.opacity = spec.opacity * snow * (1 - 0.15 * Math.min(1, gust))
    }

    const dt = Math.min(rawDt, 0.05)
    const windBase = (2.5 + 9 * snow) * spec.wind
    const windNow = (windBase + gust * 10 * spec.wind) * dt
    const fall = (7 + 20 * snow) * spec.fall * (spec.spindrift ? 0.3 : 1) * dt

    const pos = geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const { x: BX, y: BY, z: BZ } = spec.box
    for (let i = 0; i < spec.count; i++) {
      const i3 = i * 3
      arr[i3 + 1] -= fall * (0.6 + 0.4 * Math.sin(seeds[i]))
      arr[i3] += windNow * Math.sin(t * 0.7 + seeds[i]) * 0.6 - windNow * 0.55
      arr[i3 + 2] += windNow * Math.cos(t * 0.5 + seeds[i]) * 0.3
      if (arr[i3 + 1] < -BY / 2) arr[i3 + 1] += BY
      if (arr[i3] < -BX / 2) arr[i3] += BX
      if (arr[i3] > BX / 2) arr[i3] -= BX
      if (arr[i3 + 2] < -BZ / 2) arr[i3 + 2] += BZ
      if (arr[i3 + 2] > BZ / 2) arr[i3 + 2] -= BZ
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        ref={material}
        map={flake}
        color="#e8eef8"
        size={spec.size}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  )
}

const LAYERS: LayerSpec[] = [
  // Near field: fat flakes drifting past the lens.
  { count: 1300, box: { x: 70, y: 45, z: 70 }, size: 0.4, opacity: 0.8, fall: 1, wind: 1, yOffset: 0 },
  // Far field: dense small flakes — depth and volume.
  { count: 2300, box: { x: 150, y: 70, z: 150 }, size: 0.2, opacity: 0.5, fall: 0.85, wind: 0.8, yOffset: 0 },
  // Spindrift: ice dust screaming along the ground in gusts.
  {
    count: 900,
    box: { x: 90, y: 5, z: 90 },
    size: 0.16,
    opacity: 0.5,
    fall: 1,
    wind: 3.4,
    yOffset: -4.2,
    spindrift: true,
  },
]

export default function Snow() {
  return (
    <>
      {LAYERS.map((spec, i) => (
        <SnowLayer key={i} spec={spec} />
      ))}
    </>
  )
}
