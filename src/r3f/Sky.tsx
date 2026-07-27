import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey, remap } from '../journey'
import { makeRadialTexture } from './textures'

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uSunI;
  uniform vec3 uDimDir;
  uniform float uDim;
  varying vec3 vDir;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, 0.0, 1.0);

    // Three zones: a hazy band hugging the horizon, a mid gradient, deep zenith.
    vec3 col = mix(uHorizon, uTop, pow(h, 0.52));
    col += uHorizon * exp(-h * 14.0) * 0.45;          // horizon haze line
    col = mix(col, uTop * 0.82, smoothstep(0.55, 1.0, h) * 0.5); // darker zenith

    // Sun glow — wide and soft, hugging the horizon.
    float d = max(dot(dir, normalize(uSunDir)), 0.0);
    float horizonHug = exp(-max(dir.y, 0.0) * 5.0);
    col += uSunColor * uSunI * (pow(d, 180.0) * 1.5 + pow(d, 20.0) * 0.4 + pow(d, 5.0) * 0.22 * horizonHug);

    // Readability well: as the summit content arrives, the sky behind it
    // quietly loses light and saturation. Wide falloff = invisible.
    float w = smoothstep(0.78, 0.97, dot(dir, normalize(uDimDir)));
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(luma), uDim * w * 0.30);
    col *= 1.0 - uDim * w * 0.42;

    // Dither to keep the long gradients band-free.
    col += (hash12(gl_FragCoord.xy) - 0.5) * 0.006;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aMag;
  uniform float uTime;
  varying float vBright;
  varying float vWarm;
  void main() {
    // Each star twinkles on its own rhythm; brighter stars twinkle less.
    float tw = 0.72 + 0.28 * sin(uTime * (0.6 + fract(aPhase) * 1.7) + aPhase * 17.0);
    vBright = aMag * mix(tw, 1.0, aMag * 0.5);
    vWarm = fract(aPhase * 7.31);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`

const STAR_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vBright;
  varying float vWarm;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vBright * uOpacity;
    if (a < 0.003) discard;
    vec3 col = mix(vec3(0.78, 0.85, 1.0), vec3(1.0, 0.93, 0.82), vWarm * 0.5);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const STAR_COUNT = 1500

export default function Sky() {
  const group = useRef<THREE.Group>(null)
  const moonMat = useRef<THREE.MeshBasicMaterial>(null)
  const haloMat = useRef<THREE.SpriteMaterial>(null)
  const haloWideMat = useRef<THREE.SpriteMaterial>(null)
  const forward = useMemo(() => new THREE.Vector3(), [])

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#02040a') },
      uHorizon: { value: new THREE.Color('#0d1626') },
      uSunColor: { value: new THREE.Color('#f4a16a') },
      uSunDir: { value: new THREE.Vector3(0.1, 0.045, -1).normalize() },
      uSunI: { value: 0 },
      uDimDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() },
      uDim: { value: 0 },
    }),
    [],
  )

  const starUniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }), [])

  const starGeometry = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const phases = new Float32Array(STAR_COUNT)
    const mags = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) {
      // Upper hemisphere, biased away from the horizon.
      const theta = Math.random() * Math.PI * 2
      const y = 0.06 + Math.pow(Math.random(), 0.7) * 0.92
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      positions[i * 3] = Math.cos(theta) * r * 850
      positions[i * 3 + 1] = y * 850
      positions[i * 3 + 2] = Math.sin(theta) * r * 850
      // A few bright leaders, a sea of faint dust.
      const m = Math.pow(Math.random(), 2.6)
      mags[i] = 0.25 + m * 0.75
      sizes[i] = 1.1 + m * 2.6
      phases[i] = Math.random() * Math.PI * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aMag', new THREE.BufferAttribute(mags, 1))
    return geo
  }, [])

  const halo = useMemo(() => makeRadialTexture(128), [])
  const haloWide = useMemo(
    () =>
      makeRadialTexture(128, [
        [0, 'rgba(220,232,255,0.35)'],
        [0.4, 'rgba(205,222,250,0.12)'],
        [1, 'rgba(200,220,255,0)'],
      ]),
    [],
  )

  const moonDir = useMemo(() => new THREE.Vector3(0.42, 0.5, -0.65).normalize(), [])

  useFrame(({ camera, clock }) => {
    if (!group.current) return
    group.current.position.copy(camera.position)

    uniforms.uTop.value.copy(atmo.skyTop)
    uniforms.uHorizon.value.copy(atmo.skyHorizon)
    uniforms.uSunI.value = atmo.sun

    // Aim the readability well a touch above where the camera looks.
    camera.getWorldDirection(forward)
    uniforms.uDimDir.value.copy(forward)
    uniforms.uDimDir.value.y += 0.16
    uniforms.uDimDir.value.normalize()
    uniforms.uDim.value = remap(journey.p, 0.875, 0.94)

    starUniforms.uTime.value = clock.elapsedTime
    starUniforms.uOpacity.value = atmo.stars

    if (moonMat.current) moonMat.current.opacity = atmo.stars * 0.92
    if (haloMat.current) haloMat.current.opacity = atmo.stars * 0.26
    if (haloWideMat.current) haloWideMat.current.opacity = atmo.stars * 0.5
  })

  return (
    <group ref={group}>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[900, 48, 32]} />
        <shaderMaterial
          vertexShader={SKY_VERT}
          fragmentShader={SKY_FRAG}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <points renderOrder={-9}>
        <primitive object={starGeometry} attach="geometry" />
        <shaderMaterial
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          uniforms={starUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh
        position={moonDir.clone().multiplyScalar(820)}
        onUpdate={(m) => m.lookAt(0, 0, 0)}
        renderOrder={-9}
      >
        <circleGeometry args={[15, 48]} />
        <meshBasicMaterial ref={moonMat} color="#e6ecf8" transparent depthWrite={false} fog={false} />
      </mesh>
      <sprite position={moonDir.clone().multiplyScalar(815)} scale={[110, 110, 1]} renderOrder={-9}>
        <spriteMaterial ref={haloMat} map={halo} transparent opacity={0.26} depthWrite={false} fog={false} />
      </sprite>
      <sprite position={moonDir.clone().multiplyScalar(812)} scale={[340, 340, 1]} renderOrder={-9}>
        <spriteMaterial ref={haloWideMat} map={haloWide} transparent opacity={0.5} depthWrite={false} fog={false} />
      </sprite>
    </group>
  )
}
