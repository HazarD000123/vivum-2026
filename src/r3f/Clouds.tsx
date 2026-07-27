import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey, remap } from '../journey'
import { makeRadialTexture } from './textures'

interface CloudSpec {
  pos: [number, number, number]
  scale: number
  base: number
  drift: number
  high?: boolean // thin upper-air wisps, visible the whole journey
}

// A sea of clouds below the summit plateau, wisps along the ridge, and a few
// thin high clouds that give the sky depth from the very first frame.
export default function Clouds() {
  const group = useRef<THREE.Group>(null)
  const tint = useMemo(() => new THREE.Color(), [])

  const texture = useMemo(
    () =>
      makeRadialTexture(256, [
        [0, 'rgba(255,255,255,0.42)'],
        [0.45, 'rgba(235,240,250,0.20)'],
        [1, 'rgba(255,255,255,0)'],
      ]),
    [],
  )

  const specs = useMemo<CloudSpec[]>(() => {
    const list: CloudSpec[] = []
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    // The sea below the summit cliff — two stacked decks for thickness.
    for (let i = 0; i < 16; i++) {
      list.push({
        pos: [(rand() - 0.5) * 520, 30 + rand() * 28, -600 - rand() * 360],
        scale: 90 + rand() * 130,
        base: 0.3 + rand() * 0.25,
        drift: 0.4 + rand() * 0.8,
      })
    }
    for (let i = 0; i < 8; i++) {
      list.push({
        pos: [(rand() - 0.5) * 560, 14 + rand() * 12, -640 - rand() * 320],
        scale: 130 + rand() * 150,
        base: 0.38 + rand() * 0.25,
        drift: 0.3 + rand() * 0.5,
      })
    }
    // Wisps along the ice ridge.
    for (let i = 0; i < 6; i++) {
      list.push({
        pos: [(rand() - 0.5) * 220, 52 + rand() * 22, -380 - rand() * 140],
        scale: 55 + rand() * 60,
        base: 0.18 + rand() * 0.16,
        drift: 0.8 + rand() * 1.0,
      })
    }
    // High thin upper-air veils — present from the start, barely there.
    for (let i = 0; i < 5; i++) {
      list.push({
        pos: [(rand() - 0.5) * 900, 190 + rand() * 90, -750 - rand() * 500],
        scale: 240 + rand() * 220,
        base: 0.05 + rand() * 0.05,
        drift: 0.2 + rand() * 0.3,
        high: true,
      })
    }
    return list
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const reveal = remap(journey.p, 0.64, 0.78)
    const t = clock.elapsedTime
    // Clouds take the color of the air around them, warming at sunrise.
    tint.copy(atmo.fog).lerp(atmo.skyHorizon, 0.5).lerp(atmo.dirLight, atmo.sun * 0.35)
    group.current.children.forEach((child, i) => {
      const spec = specs[i]
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial
      const vis = spec.high ? 1 : reveal
      mat.opacity = spec.base * vis * (0.85 + 0.15 * Math.sin(t * 0.1 + i))
      mat.color.copy(tint).multiplyScalar(spec.high ? 1.05 : 1.18)
      mesh.position.x = spec.pos[0] + Math.sin(t * 0.03 * spec.drift + i * 2.1) * 18
    })
  })

  return (
    <group ref={group}>
      {specs.map((spec, i) => (
        <mesh key={i} position={spec.pos} rotation={[-Math.PI / 2, 0, (i * 1.7) % Math.PI]}>
          <planeGeometry args={[spec.scale, spec.scale * 0.62]} />
          <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} fog={false} />
        </mesh>
      ))}
    </group>
  )
}
