import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { makeBeamTexture, makeRadialTexture } from '../../r3f/textures'
import type { LandmarkKind, RegionLocation } from '../data'

// ---------------------------------------------------------------------------
// The landmark library — lodges, camps, beacons, pavilions, stations, summit
// markers, ice stages and installations, all built from the same flat-shaded
// vocabulary as the ascent props. Every landmark shares one `glow` value,
// damped per frame, that drives its lights, beam, pool and label together —
// rest / hover / focused are positions on that one dial.
// ---------------------------------------------------------------------------

type Glow = MutableRefObject<number>

interface BuilderProps {
  accent: string
  glow: Glow
}

let _beamTex: THREE.Texture | null = null
const beamTex = () => (_beamTex ??= makeBeamTexture())
let _glowTex: THREE.Texture | null = null
const glowTex = () => (_glowTex ??= makeRadialTexture(128))

/* ------------------------------------------------------------------ */
/*  Shared light pieces                                                */
/* ------------------------------------------------------------------ */

function Beam({
  height,
  width,
  color,
  glow,
  base = 0.5,
}: {
  height: number
  width: number
  color: string
  glow: Glow
  base?: number
}) {
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  useFrame(() => {
    for (const m of mats.current) m.opacity = base * glow.current
  })
  return (
    <group>
      {[0, Math.PI / 2].map((ry, i) => (
        <mesh key={i} position={[0, height / 2, 0]} rotation={[0, ry, 0]} scale={[1, -1, 1]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m
            }}
            map={beamTex()}
            color={color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function LightPool({
  size,
  color,
  glow,
  base = 0.18,
}: {
  size: number
  color: string
  glow: Glow
  base?: number
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (mat.current) mat.current.opacity = base * glow.current
  })
  return (
    <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        ref={mat}
        map={glowTex()}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Building kinds                                                     */
/* ------------------------------------------------------------------ */

function Lodge({ glow }: BuilderProps) {
  const light = useRef<THREE.PointLight>(null)
  const winMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1c1812',
        emissive: new THREE.Color('#ffb877'),
        emissiveIntensity: 1,
        roughness: 1,
      }),
    [],
  )
  useFrame(({ clock }) => {
    const f = 1 + Math.sin(clock.elapsedTime * 2.1) * 0.07
    winMat.emissiveIntensity = (0.7 + glow.current * 0.9) * f
    if (light.current) light.current.intensity = 11 * glow.current * f
  })
  return (
    <group>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[6.4, 2.8, 4.6]} />
        <meshStandardMaterial color="#39435c" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 3.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.5, 2.3, 4]} />
        <meshStandardMaterial color="#2b3346" roughness={1} flatShading />
      </mesh>
      {[-1.9, 0, 1.9].map((wx) => (
        <mesh key={wx} position={[wx, 1.35, 2.32]}>
          <planeGeometry args={[0.9, 1.1]} />
          <primitive object={winMat} attach="material" />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 2.6, 4.5]} color="#ffa15e" distance={28} decay={1.9} />
    </group>
  )
}

function Camp({ glow }: BuilderProps) {
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flicker = 1 + Math.sin(t * 9) * 0.13 + Math.sin(t * 23) * 0.08
    if (light.current) light.current.intensity = 9 * glow.current * flicker
  })
  const tents: Array<[number, number, number]> = [
    [-3.4, -1.2, 0.5],
    [3.2, -2.4, -0.9],
    [0.4, 2.8, 1.8],
  ]
  return (
    <group>
      {tents.map(([x, z, rot], i) => (
        <mesh key={i} position={[x, 1.0, z]} rotation={[0, rot, 0]}>
          <coneGeometry args={[1.8, 2.0, 4]} />
          <meshStandardMaterial
            color="#39435c"
            emissive="#ff8c4a"
            emissiveIntensity={0.2}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 1.6, 0]} color="#ff9a4a" distance={26} decay={1.8} />
    </group>
  )
}

function Beacon({ accent, glow }: BuilderProps) {
  const light = useRef<THREE.PointLight>(null)
  const lampMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1412',
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1.4,
        roughness: 0.8,
      }),
    [accent],
  )
  useFrame(({ clock }) => {
    const pulse = 0.72 + 0.28 * Math.sin(clock.elapsedTime * 2.4)
    lampMat.emissiveIntensity = (0.9 + glow.current * 1.6) * pulse
    if (light.current) light.current.intensity = 12 * glow.current * pulse
  })
  return (
    <group>
      <mesh position={[0, 7.5, 0]}>
        <cylinderGeometry args={[0.16, 0.36, 15, 6]} />
        <meshStandardMaterial color="#3c4456" roughness={1} flatShading />
      </mesh>
      {[4.6, 9.4].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[1.7, 0.12, 0.12]} />
          <meshStandardMaterial color="#4a5266" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 15.4, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <primitive object={lampMat} attach="material" />
      </mesh>
      <pointLight ref={light} position={[0, 15.4, 0]} color={accent} distance={50} decay={1.7} />
    </group>
  )
}

function Pavilion({ accent, glow }: BuilderProps) {
  const light = useRef<THREE.PointLight>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    const breath = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 1.3)
    if (light.current) light.current.intensity = 8 * glow.current * breath
    if (glowMat.current) glowMat.current.opacity = 0.3 * glow.current * breath
  })
  const columns = useMemo(() => {
    const list: Array<[number, number]> = []
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      list.push([Math.cos(a) * 4, Math.sin(a) * 4])
    }
    return list
  }, [])
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[5.1, 5.7, 0.7, 8]} />
        <meshStandardMaterial color="#566179" roughness={0.6} flatShading />
      </mesh>
      {columns.map(([x, z], i) => (
        <mesh key={i} position={[x, 2.4, z]}>
          <cylinderGeometry args={[0.18, 0.22, 3.6, 6]} />
          <meshStandardMaterial color="#7e8aa4" roughness={0.8} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 5.1, 0]}>
        <coneGeometry args={[5.6, 1.9, 8]} />
        <meshStandardMaterial color="#2b3346" roughness={1} flatShading />
      </mesh>
      {/* lit canopy underside */}
      <mesh position={[0, 4.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.7, 24]} />
        <meshBasicMaterial
          ref={glowMat}
          color={accent}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>
      <pointLight ref={light} position={[0, 3, 0]} color={accent} distance={30} decay={1.8} />
    </group>
  )
}

function Station({ accent, glow }: BuilderProps) {
  const blink = useRef<THREE.MeshStandardMaterial>(null)
  const winMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#181a14',
        emissive: new THREE.Color('#cfe3a8'),
        emissiveIntensity: 0.9,
        roughness: 1,
      }),
    [],
  )
  useFrame(({ clock }) => {
    if (blink.current)
      blink.current.emissiveIntensity =
        Math.sin(clock.elapsedTime * 2.2) > 0.45 ? 1.6 + glow.current : 0.1
    winMat.emissiveIntensity = 0.5 + glow.current * 0.8
  })
  return (
    <group>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[3.8, 2.6, 3.1]} />
        <meshStandardMaterial color="#414b62" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 2.78, 0]}>
        <boxGeometry args={[4.1, 0.36, 3.4]} />
        <meshStandardMaterial color="#2b3346" roughness={1} flatShading />
      </mesh>
      <mesh position={[1.05, 1.25, 1.58]}>
        <planeGeometry args={[1.2, 0.9]} />
        <primitive object={winMat} attach="material" />
      </mesh>
      <mesh position={[-1.1, 5.8, -0.6]}>
        <cylinderGeometry args={[0.07, 0.14, 9.4, 6]} />
        <meshStandardMaterial color="#4a5266" roughness={1} />
      </mesh>
      {[8.2, 9.4].map((y, i) => (
        <mesh key={y} position={[-1.1, y, -0.6]}>
          <boxGeometry args={[1.5 - i * 0.5, 0.08, 0.08]} />
          <meshStandardMaterial color="#4a5266" roughness={1} />
        </mesh>
      ))}
      <mesh position={[-1.1, 10.6, -0.6]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshStandardMaterial ref={blink} color="#241410" emissive={accent} emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function SummitMarker({ accent, glow }: BuilderProps) {
  const flag = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (flag.current) flag.current.rotation.y = Math.sin(t * 2.6) * 0.14
    if (light.current) light.current.intensity = 7 * glow.current
  })
  return (
    <group>
      <mesh position={[0.9, 0.55, -0.4]}>
        <coneGeometry args={[1.1, 1.3, 5]} />
        <meshStandardMaterial color="#6f7990" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.9, 1.4, -0.4]}>
        <coneGeometry args={[0.6, 1.0, 5]} />
        <meshStandardMaterial color="#7d8aa2" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 5.4, 6]} />
        <meshStandardMaterial color="#4a5266" roughness={1} />
      </mesh>
      <mesh ref={flag} position={[0.85, 4.7, 0]} rotation={[0, 0, -0.05]}>
        <planeGeometry args={[1.6, 0.9]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.45}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight ref={light} position={[0, 4.4, 0]} color={accent} distance={34} decay={1.8} />
    </group>
  )
}

function IceStage({ accent, glow }: BuilderProps) {
  const archMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a2430',
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1,
        roughness: 0.7,
      }),
    [accent],
  )
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const breath = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 1.1)
    archMat.emissiveIntensity = (0.6 + glow.current * 1.1) * breath
    if (light.current) light.current.intensity = 9 * glow.current * breath
  })
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[5.4, 5.9, 0.56, 24]} />
        <meshStandardMaterial color="#3d4c64" roughness={0.35} metalness={0.25} flatShading />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <torusGeometry args={[4.3, 0.16, 8, 40, Math.PI]} />
        <primitive object={archMat} attach="material" />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <group key={x} position={[x, 0.4, -1.6]} rotation={[0, 0, x < 0 ? 0.16 : -0.16]}>
          <Beam height={11} width={1.5} color={accent} glow={glow} base={0.34} />
        </group>
      ))}
      <pointLight ref={light} position={[0, 3.4, 0]} color={accent} distance={32} decay={1.8} />
    </group>
  )
}

function Installation({ accent, glow }: BuilderProps) {
  const ring = useRef<THREE.Group>(null)
  const discMat = useRef<THREE.MeshBasicMaterial>(null)
  const ringMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#16202c',
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1.1,
        roughness: 0.6,
      }),
    [accent],
  )
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }, dt) => {
    const breath = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 0.9)
    if (ring.current) ring.current.rotation.y += dt * 0.14
    ringMat.emissiveIntensity = (0.7 + glow.current * 1.2) * breath
    if (discMat.current) discMat.current.opacity = 0.14 * glow.current * breath
    if (light.current) light.current.intensity = 8 * glow.current * breath
  })
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.8, 0.6, 1.8]} />
        <meshStandardMaterial color="#39435c" roughness={1} flatShading />
      </mesh>
      <group ref={ring} position={[0, 3.9, 0]}>
        <mesh>
          <torusGeometry args={[3.0, 0.13, 10, 48]} />
          <primitive object={ringMat} attach="material" />
        </mesh>
        <mesh>
          <circleGeometry args={[2.7, 36]} />
          <meshBasicMaterial
            ref={discMat}
            color={accent}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 4, 0]} color={accent} distance={30} decay={1.8} />
    </group>
  )
}

const BUILDERS: Record<LandmarkKind, (props: BuilderProps) => JSX.Element> = {
  lodge: Lodge,
  camp: Camp,
  beacon: Beacon,
  pavilion: Pavilion,
  station: Station,
  summit: SummitMarker,
  stage: IceStage,
  installation: Installation,
}

const LABEL_H: Record<LandmarkKind, number> = {
  lodge: 8,
  camp: 6,
  beacon: 19.5,
  pavilion: 9,
  station: 13,
  summit: 10,
  stage: 9,
  installation: 9.5,
}

// Lodges and camps glow hearth-orange; everything else takes the region accent.
const WARM_KINDS = new Set<LandmarkKind>(['lodge', 'camp'])

/* ------------------------------------------------------------------ */
/*  The landmark wrapper — interaction, light dressing, label          */
/* ------------------------------------------------------------------ */

export default function Landmark({
  loc,
  y,
  accent,
  active,
  dimmed,
  onSelect,
}: {
  loc: RegionLocation
  y: number
  accent: string
  active: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const glow = useRef(0.2)

  useFrame((_, dt) => {
    const target = (active ? 1.6 : hovered ? 1.15 : 0.62) * (dimmed ? 0.32 : 1)
    glow.current += (target - glow.current) * Math.min(1, dt * 4)
  })

  const Builder = BUILDERS[loc.kind]
  const poolColor = WARM_KINDS.has(loc.kind) ? '#ff8c42' : accent

  return (
    <group position={[loc.x, y, loc.z]}>
      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
      >
        <Builder accent={accent} glow={glow} />
        {/* generous invisible hit volume so distant landmarks are clickable */}
        <mesh position={[0, 4.5, 0]}>
          <sphereGeometry args={[7.5, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      {(loc.kind === 'summit' || loc.kind === 'beacon') && (
        <Beam
          height={loc.kind === 'summit' ? 17 : 11}
          width={2.4}
          color={accent}
          glow={glow}
          base={0.5}
        />
      )}
      <LightPool size={WARM_KINDS.has(loc.kind) ? 26 : 21} color={poolColor} glow={glow} />

      <Html
        center
        position={[0, LABEL_H[loc.kind], 0]}
        zIndexRange={[4, 1]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`lm-label${hovered || active ? ' is-hot' : ''}${dimmed ? ' is-dim' : ''}`}
          style={{ '--rg-accent': accent } as CSSProperties}
        >
          <span className="lm-label__kind">{loc.kindLabel}</span>
          <span className="lm-label__name">{loc.name}</span>
          <span className="lm-label__tick" aria-hidden />
        </div>
      </Html>
    </group>
  )
}
