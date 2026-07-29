import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey, remap } from '../journey'

// A quiet aurora — desaturated arctic green, slow drift, hung far behind the
// outermost range so it reads as distance, not decoration. It dims further
// while the summit content is on screen: the mountains stay the stars.

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec3 col = vec3(0.0);
    float a = 0.0;
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float x = vUv.x * (1.6 + fi * 0.7) + uTime * (0.008 + 0.006 * fi) + fi * 9.1;
      float center = 0.26 + 0.18 * fi + 0.11 * sin(x * 2.3) + 0.05 * sin(x * 5.1 + fi * 2.0);
      // Curtains glow at the base and dissolve upward.
      float dy = vUv.y - center;
      float band = smoothstep(-0.045, 0.012, dy) * exp(-max(dy, 0.0) * 7.5);
      float curtain = 0.72 + 0.28 * sin(vUv.x * 34.0 + sin(uTime * 0.07 + fi) * 3.0 + fi * 5.0);
      float k = band * curtain;
      // Desaturated sage green, cooling slightly with height.
      col += k * mix(vec3(0.38, 0.62, 0.48), vec3(0.32, 0.44, 0.55), clamp(dy * 3.0 + fi * 0.3, 0.0, 1.0));
      a += k;
    }
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
               * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    gl_FragColor = vec4(col * 0.30, clamp(a, 0.0, 1.0) * edge * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function Aurora() {
  const material = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    // Recede while the summit text is up — content over environment.
    const contentDim = 1 - 0.4 * remap(journey.p, 0.875, 0.94)
    uniforms.uOpacity.value = atmo.aurora * 0.55 * contentDim
  })

  return (
    <mesh position={[70, 310, -1880]} renderOrder={-6}>
      <planeGeometry args={[1500, 460]} />
      <shaderMaterial
        ref={material}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
