import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { terrainHeight, zAt } from './terrainMath'
import { makeRadialTexture } from './textures'

// Physical storytelling along the route: glowing tents at base camp, stone
// cairns marking the trail, checkpoint flags, a signal tower, and the
// standing stone at the summit.

const groundAt = (x: number, z: number) => terrainHeight(x, z)

// An alpine ridge tent in the site's flat-shaded idiom: dark storm-canvas
// pyramid, snow gathered on the peak and drifted around the base, and a small
// lantern glow at the door — the camp's warmth is a detail, not a beacon.
function Tent({ x, z, rot, s = 1 }: { x: number; z: number; rot: number; s?: number }) {
  const y = groundAt(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]} scale={s}>
      {/* Snow drifted around the pitch */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.05, 2.55, 0.34, 8]} />
        <meshStandardMaterial
          color="#9fb0ca"
          emissive="#232c40"
          emissiveIntensity={0.55}
          roughness={1}
          flatShading
        />
      </mesh>
      {/* Canvas body — faces squared to the door, not vertex-forward. The
          faint cool emissive is snow-bounce fill: night canvas, never a void. */}
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.9, 2.2, 4]} />
        <meshStandardMaterial
          color="#3a4763"
          emissive="#151d30"
          emissiveIntensity={0.7}
          roughness={0.95}
          flatShading
        />
      </mesh>
      {/* Snow settled on the peak */}
      <mesh position={[0, 1.78, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.72, 0.85, 4]} />
        <meshStandardMaterial
          color="#aebdd6"
          emissive="#2b3550"
          emissiveIntensity={0.6}
          roughness={1}
          flatShading
        />
      </mesh>
      {/* Ridge pole tips crossed above the peak */}
      <mesh position={[0.09, 2.42, 0]} rotation={[0, 0, 0.42]}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 5]} />
        <meshStandardMaterial color="#4a5266" roughness={1} />
      </mesh>
      <mesh position={[-0.09, 2.42, 0]} rotation={[0, 0, -0.42]}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 5]} />
        <meshStandardMaterial color="#4a5266" roughness={1} />
      </mesh>
      {/* Lantern light escaping the unzipped door */}
      <mesh position={[0, 0.62, 1.0]} rotation={[-0.55, 0, 0]}>
        <circleGeometry args={[0.42, 3]} />
        <meshStandardMaterial
          color="#1c2333"
          emissive="#ffab5e"
          emissiveIntensity={1.1}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function CampLight({ x, z }: { x: number; z: number }) {
  const light = useRef<THREE.PointLight>(null)
  const pool = useRef<THREE.MeshBasicMaterial>(null)
  const poolTex = useMemo(() => makeRadialTexture(128), [])
  const y = groundAt(x, z) + 2
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flicker = 1 + Math.sin(t * 9) * 0.13 + Math.sin(t * 23) * 0.08
    if (light.current) light.current.intensity = 13 * flicker
    // The terrain shader doesn't see point lights — paint the warm pool on
    // the snow ourselves.
    if (pool.current) pool.current.opacity = 0.11 * flicker
  })
  return (
    <group>
      <pointLight ref={light} position={[x, y, z]} color="#ff9a4a" intensity={13} distance={36} decay={1.8} />
      <mesh position={[x, y - 1.7, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 34]} />
        <meshBasicMaterial
          ref={pool}
          map={poolTex}
          color="#ff8c42"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Cairn({ x, z }: { x: number; z: number }) {
  const y = groundAt(x, z)
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.9, 1.1, 5]} />
        <meshStandardMaterial color="#8a94aa" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.55, 0.9, 5]} />
        <meshStandardMaterial color="#9aa4b8" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function CheckpointFlag({ x, z }: { x: number; z: number }) {
  const y = groundAt(x, z)
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 3.6, 6]} />
        <meshStandardMaterial color="#4a5266" roughness={1} />
      </mesh>
      <mesh position={[0.75, 3.1, 0]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color="#d96846" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function SignalTower({ x, z }: { x: number; z: number }) {
  const beacon = useRef<THREE.MeshStandardMaterial>(null)
  const y = groundAt(x, z)
  useFrame(({ clock }) => {
    if (!beacon.current) return
    beacon.current.emissiveIntensity = Math.sin(clock.elapsedTime * 2.4) > 0.55 ? 2.4 : 0.12
  })
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 6.5, 0]}>
        <cylinderGeometry args={[0.1, 0.22, 13, 6]} />
        <meshStandardMaterial color="#3c4456" roughness={1} />
      </mesh>
      <mesh position={[0, 13.2, 0]}>
        <sphereGeometry args={[0.34, 12, 12]} />
        <meshStandardMaterial ref={beacon} color="#54181a" emissive="#ff3b30" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

function SummitStone() {
  const x = -19
  const z = -548
  const y = groundAt(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, 0.35, 0.02]}>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[1.4, 5.4, 0.9]} />
        <meshStandardMaterial color="#6a7488" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

export default function TrailProps() {
  // Cairns every ~45 units along the climbing route, offset to alternate sides.
  const cairns = useMemo(() => {
    const list: Array<[number, number]> = []
    for (let z = -50; z > -520; z -= 45) {
      const side = list.length % 2 === 0 ? 1 : -1
      list.push([side * (7.5 + (Math.abs(z) % 13) * 0.35), z])
    }
    return list
  }, [])

  // Checkpoint flags where the expedition-stage discoveries appear.
  const flags = useMemo(() => [0.53, 0.57, 0.61, 0.65].map((p) => zAt(p)), [])

  return (
    <group>
      {/* Base camp, around p ≈ 0.13–0.17 — doors gathered toward the fire */}
      <Tent x={-12} z={-64} rot={2.4} />
      <Tent x={10} z={-76} rot={-1.57} s={0.88} />
      <Tent x={-10} z={-90} rot={0.57} s={1.05} />
      <CampLight x={-1} z={-76} />

      {cairns.map(([x, z], i) => (
        <Cairn key={i} x={x} z={z} />
      ))}

      {flags.map((z, i) => (
        <CheckpointFlag key={i} x={i % 2 === 0 ? -7 : 7.5} z={z} />
      ))}

      <SignalTower x={24} z={-316} />
      <SummitStone />
    </group>
  )
}
