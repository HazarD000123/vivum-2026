import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo } from '../journey'
import { terrainHeight } from './terrainMath'

const WIDTH = 620
const LENGTH = 1100
const SEG_W = 200
const SEG_L = 400
const CENTER_Z = -470 // plane spans z ∈ [80, -1020]

// Custom snow shader: half-Lambert diffuse (snow is forward-scattering),
// slope-driven snow/ice/rock albedo, wind-streaked sastrugi breakup, sparse
// sparkle glints, and a distance+height fog that cools and desaturates with
// range — atmospheric perspective the built-in FogExp2 can't do.

const VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uLightDir;
  uniform vec3 uLightColor;
  uniform float uLightI;
  uniform vec3 uAmbColor;
  uniform float uAmbI;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform vec3 uCamPos;
  uniform float uTime;
  uniform vec3 uSnowCol;
  uniform vec3 uIceCol;
  uniform vec3 uRockCol;

  varying vec3 vWorldPos;
  varying vec3 vNormal;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * vnoise(p);
      p *= 2.17;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCamPos - vWorldPos);
    float dist = distance(uCamPos, vWorldPos);

    // --- Albedo: snow on flats, blue ice on mid slopes, rock on faces ----
    float slope = 1.0 - N.y;
    float breakup = fbm(vWorldPos.xz * 0.13);
    // Sastrugi: wind-streaked snow texture, stretched along the valley axis.
    float sastrugi = vnoise(vec2(vWorldPos.x * 0.55, vWorldPos.z * 0.1));

    vec3 snowCol = uSnowCol;
    vec3 iceCol  = uIceCol;
    vec3 rockCol = uRockCol;

    float s = slope + (breakup - 0.5) * 0.28;
    // High faces hold rime even when steep.
    s -= smoothstep(40.0, 150.0, vWorldPos.y) * 0.10;
    float snowAmt = 1.0 - smoothstep(0.18, 0.52, s);
    float rockAmt = smoothstep(0.42, 0.78, s);
    vec3 albedo = mix(iceCol, snowCol, snowAmt);
    albedo = mix(albedo, rockCol, rockAmt);
    albedo *= 0.92 + 0.08 * sastrugi + 0.06 * (breakup - 0.5);

    // --- Lighting ---------------------------------------------------------
    float hl = dot(N, L) * 0.5 + 0.5;        // half-Lambert wrap
    float diffuse = hl * hl;
    // Slope-derived ambient occlusion: faces and gullies sit in shadow.
    float ao = 0.55 + 0.45 * clamp(N.y, 0.0, 1.0);
    vec3 light = uLightColor * (uLightI * diffuse) + uAmbColor * (uAmbI * ao);

    // Soft specular sheen — low sun glancing off snow crust.
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 28.0) * 0.30 * snowAmt * uLightI;

    // Sparse sparkle glints in the near field.
    vec2 cell = floor(vWorldPos.xz * 5.0);
    float glint = step(0.996, hash12(cell + floor(uTime * 1.5)));
    float sparkle = glint * snowAmt * uLightI * (1.0 - smoothstep(20.0, 90.0, dist)) * 0.5;

    vec3 col = albedo * light + uLightColor * (spec + sparkle);

    // --- Atmospheric perspective -------------------------------------
    // Cool + desaturate with range before the fog mix, so distance reads
    // even where fog is thin.
    float coolShift = 1.0 - exp(-dist * 0.0028);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(luma) * vec3(0.82, 0.92, 1.12), coolShift * 0.45);

    // Height-aware fog: haze pools low, summits pierce it.
    float heightAtten = mix(1.0, 0.45, smoothstep(0.0, 70.0, vWorldPos.y - uCamPos.y));
    float fogAmt = 1.0 - exp(-pow(dist * uFogDensity * heightAtten, 2.0) * 2.2);
    col = mix(col, uFogColor, clamp(fogAmt, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// The shared terrain surface — the ascent and every category region use the
// same shader; only the geometry and the albedo palette change.

export interface TerrainPalette {
  snow: string
  ice: string
  rock: string
}

// Matches the original hand-tuned albedo of the main ascent.
const DEFAULT_PALETTE: TerrainPalette = { snow: '#d1def2', ice: '#859ec2', rock: '#2b303d' }

export function TerrainMesh({
  geometry,
  palette = DEFAULT_PALETTE,
}: {
  geometry: THREE.BufferGeometry
  palette?: TerrainPalette
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uLightDir: { value: new THREE.Vector3(60, 90, -40).normalize() },
      uLightColor: { value: new THREE.Color('#88a8dc') },
      uLightI: { value: 0.5 },
      uAmbColor: { value: new THREE.Color('#9db4d6') },
      uAmbI: { value: 0.25 },
      uFogColor: { value: new THREE.Color('#070e1a') },
      uFogDensity: { value: 0.0042 },
      uCamPos: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uSnowCol: { value: new THREE.Color(palette.snow) },
      uIceCol: { value: new THREE.Color(palette.ice) },
      uRockCol: { value: new THREE.Color(palette.rock) },
    }),
    [palette],
  )

  useFrame(({ camera, clock }) => {
    if (!matRef.current) return
    const sun = atmo.sun
    // Mirrors the directional light rig in World.tsx (camera-relative).
    uniforms.uLightDir.value.set(60 - sun * 30, 90 - sun * 60, -40 - sun * 160).normalize()
    uniforms.uLightColor.value.copy(atmo.dirLight)
    uniforms.uLightI.value = atmo.dirIntensity
    uniforms.uAmbColor.value.copy(atmo.skyHorizon).lerp(atmo.skyTop, 0.4)
    uniforms.uAmbI.value = atmo.ambIntensity
    uniforms.uFogColor.value.copy(atmo.fog)
    uniforms.uFogDensity.value = atmo.fogDensity
    uniforms.uCamPos.value.copy(camera.position)
    uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh geometry={geometry}>
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  )
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, LENGTH, SEG_W, SEG_L)
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0, CENTER_Z)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrainHeight(x, z))
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [])

  return <TerrainMesh geometry={geometry} />
}
