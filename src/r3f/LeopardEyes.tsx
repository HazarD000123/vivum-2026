import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey, remap } from '../journey'
import { terrainHeight } from './terrainMath'

interface EyesProps {
  x: number
  z: number
  lift?: number
  window: [number, number]
  seed: number
}

// A pair of eyes in the dark. Never explained, never fully shown — they fade
// in for a stretch of the climb, blink, and are gone.
function Eyes({ x, z, lift = 7, window: win, seed }: EyesProps) {
  const group = useRef<THREE.Group>(null)
  const left = useRef<THREE.MeshBasicMaterial>(null)
  const right = useRef<THREE.MeshBasicMaterial>(null)
  const y = terrainHeight(x, z) + lift

  useFrame(({ camera, clock }) => {
    if (!group.current || !left.current || !right.current) return
    group.current.lookAt(camera.position)

    const p = journey.p
    const fadeIn = remap(p, win[0], win[0] + 0.025)
    const fadeOut = 1 - remap(p, win[1] - 0.025, win[1])
    let opacity = Math.min(fadeIn, fadeOut) * 0.9

    // Blink: brief closures on an irregular rhythm.
    const t = clock.elapsedTime
    const blink = Math.abs(Math.sin(t * 0.6 + seed)) > 0.992 ? 0 : 1
    opacity *= blink
    // Subtle shimmer so they read as alive, not as LEDs.
    opacity *= 0.8 + 0.2 * Math.sin(t * 2.2 + seed * 3)

    left.current.opacity = opacity
    right.current.opacity = opacity
  })

  return (
    <group ref={group} position={[x, y, z]}>
      <mesh position={[-0.65, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial ref={left} color="#c2ecff" transparent opacity={0} fog={false} />
      </mesh>
      <mesh position={[0.65, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial ref={right} color="#c2ecff" transparent opacity={0} fog={false} />
      </mesh>
    </group>
  )
}

export default function LeopardEyes() {
  return (
    <>
      {/* Base camp: far up on the ridge, barely there. */}
      <Eyes x={34} z={-132} lift={9} window={[0.13, 0.23]} seed={1.3} />
      {/* The valley: across the frozen river. */}
      <Eyes x={-42} z={-238} lift={8} window={[0.36, 0.46]} seed={2.9} />
      {/* The ice ridge: close now. Watching. */}
      <Eyes x={15} z={-446} lift={6} window={[0.70, 0.81]} seed={4.1} />
    </>
  )
}
