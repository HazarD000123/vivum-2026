import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo } from '../journey'
import { ridged } from './terrainMath'

// Layered far ranges — the atmospheric perspective backbone. Each layer is a
// silhouette ribbon whose color sinks toward the horizon haze by a per-layer
// amount: nearer ridges keep contrast, farther ones dissolve into sky.

interface RangeSpec {
  z?: number // back strip at this z…
  x?: number // …or side strip at this x
  width: number
  amp: number
  base: number
  seed: number
  haze: number // 0 = crisp foreground, 1 = fully dissolved into sky
}

const SPECS: RangeSpec[] = [
  { z: -1260, width: 3000, amp: 240, base: 40, seed: 11.3, haze: 0.45 },
  { z: -1720, width: 4200, amp: 340, base: 90, seed: 47.8, haze: 0.72 },
  { x: -640, width: 2400, amp: 260, base: 20, seed: 23.1, haze: 0.5 },
  { x: 640, width: 2400, amp: 250, base: 20, seed: 71.6, haze: 0.5 },
]

const VERT = /* glsl */ `
  varying float vY;
  varying float vX;
  void main() {
    vY = position.y;
    vX = position.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uHazeColor;
  uniform float uHaze;
  uniform float uPeak;
  uniform vec3 uSunColor;
  uniform float uSun;
  varying float vY;
  varying float vX;

  float hash11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
  float n1(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash11(i), hash11(i + 1.0), u);
  }

  void main() {
    float frac = clamp(vY / uPeak, 0.0, 1.0);
    // Faint snow towards the crests, broken by noise so it isn't a band.
    float snowLine = 0.42 + 0.18 * n1(vX * 0.013);
    float snow = smoothstep(snowLine, snowLine + 0.3, frac);
    vec3 col = mix(uBase, uBase * 1.9 + vec3(0.05, 0.06, 0.08), snow * 0.7);
    // Sunrise kisses the high faces.
    col += uSunColor * (uSun * snow * frac * 0.16);
    // Per-layer haze, heavier toward the base — ridges melt into the valley air.
    float haze = clamp(uHaze + (1.0 - frac) * 0.45, 0.0, 1.0);
    col = mix(col, uHazeColor, haze);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function buildRibbon(spec: RangeSpec) {
  const segs = 260
  const geo = new THREE.PlaneGeometry(spec.width, 1, segs, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const half = spec.width / 2
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    if (pos.getY(i) > 0) {
      // Top edge → ridge profile; envelope keeps the strip ends low.
      const env = 1 - Math.pow(Math.abs(x) / half, 3)
      const r = ridged(x * 0.0021 + spec.seed, spec.seed * 1.7)
      pos.setY(i, spec.base + spec.amp * (0.22 + 0.78 * r) * Math.max(env, 0.05))
    } else {
      pos.setY(i, -120)
    }
  }
  pos.needsUpdate = true
  return geo
}

function Range({ spec }: { spec: RangeSpec }) {
  const geometry = useMemo(() => buildRibbon(spec), [spec])
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color('#0a1220') },
      uHazeColor: { value: new THREE.Color('#0d1626') },
      uHaze: { value: spec.haze },
      uPeak: { value: spec.base + spec.amp },
      uSunColor: { value: new THREE.Color('#f6bd84') },
      uSun: { value: 0 },
    }),
    [spec],
  )

  useFrame(() => {
    // Haze thickens with the weather and never lets far layers sharpen fully.
    const weather = THREE.MathUtils.clamp(atmo.fogDensity / 0.005, 0.6, 1.5)
    uniforms.uHaze.value = THREE.MathUtils.clamp(spec.haze * weather, 0.25, 0.96)
    uniforms.uHazeColor.value.copy(atmo.fog).lerp(atmo.skyHorizon, 0.55)
    uniforms.uBase.value.copy(atmo.skyTop).multiplyScalar(0.55).lerp(atmo.fog, 0.25)
    uniforms.uSunColor.value.copy(atmo.dirLight)
    uniforms.uSun.value = atmo.sun
  })

  const position: [number, number, number] =
    spec.z !== undefined ? [0, 0, spec.z] : [spec.x!, 0, -500]
  const rotationY = spec.z !== undefined ? 0 : spec.x! < 0 ? Math.PI / 2 : -Math.PI / 2

  return (
    <mesh geometry={geometry} position={position} rotation={[0, rotationY, 0]}>
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  )
}

export default function DistantRanges() {
  return (
    <>
      {SPECS.map((spec, i) => (
        <Range key={i} spec={spec} />
      ))}
    </>
  )
}
