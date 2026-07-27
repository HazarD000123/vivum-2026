import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey } from '../../journey'

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// The snow-leopard pelt. A bespoke shader rather than MeshStandardMaterial so
// the fur can do three things the scene needs:
//   1. read the same atmosphere (light, fog, aerial perspective) as the
//      terrain shader — so the animal is *in* the world, not pasted over it;
//   2. carry a fresnel back-light rim that ignites along its edge at sunrise —
//      the halo of a backlit coat, the single thing that sells "alive at dawn";
//   3. break the smoky grey with soft rosettes that dissolve with distance, so
//      up close it reads as a pelt and far off it stays a clean silhouette.

const VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
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
  uniform vec3 uBaseColor;
  uniform vec3 uBellyColor;
  uniform vec3 uSpotColor;
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform float uOpacity;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCamPos - vWorldPos);
    float dist = distance(uCamPos, vWorldPos);

    // --- Pelt albedo ------------------------------------------------------
    // Pale smoky grey over the back, creamy white on the underside. The belly
    // shows where surfaces turn downward (snow leopards are near-white below).
    float belly = smoothstep(0.05, -0.55, N.y);
    vec3 albedo = mix(uBaseColor, uBellyColor, belly);

    // Open-ring rosettes from layered noise, only on the upper coat, dissolving
    // with range so the far silhouette stays clean.
    float n = vnoise(vLocalPos * 1.7);
    float ring = smoothstep(0.5, 0.57, n) - smoothstep(0.66, 0.74, n);
    float fleck = smoothstep(0.78, 0.86, vnoise(vLocalPos * 5.1 + 11.0));
    float coatMask = (1.0 - belly) * (1.0 - smoothstep(40.0, 130.0, dist));
    float spots = clamp(ring + fleck * 0.5, 0.0, 1.0) * coatMask;
    albedo = mix(albedo, uSpotColor, spots * 0.55);
    // A faint fur grain so flat planes of the coat never look like plastic.
    albedo *= 0.93 + 0.07 * vnoise(vLocalPos * 22.0);

    // --- Lighting ---------------------------------------------------------
    float hl = dot(N, L) * 0.5 + 0.5;       // half-Lambert: fur forward-scatters
    float diffuse = hl * hl;
    float ao = 0.55 + 0.45 * clamp(N.y, 0.0, 1.0);
    vec3 lit = albedo * (uLightColor * (uLightI * diffuse) + uAmbColor * (uAmbI * ao));

    // Soft sheen — low sun grazing the guard hairs.
    vec3 H = normalize(L + V);
    float sheen = pow(max(dot(N, H), 0.0), 18.0) * 0.16 * uLightI;
    lit += uLightColor * sheen;

    // --- Back-light rim: the coat catches fire at the edges at dawn -------
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    // Strongest where the light rakes from behind the animal toward the camera.
    float backlit = clamp(dot(-L, V) * 0.5 + 0.5, 0.0, 1.0);
    float rim = fres * (0.35 + 0.65 * backlit) * uRimStrength;
    lit += uRimColor * rim;

    // --- Aerial perspective + fog (matched to the terrain shader) --------
    float coolShift = 1.0 - exp(-dist * 0.0028);
    float luma = dot(lit, vec3(0.299, 0.587, 0.114));
    lit = mix(lit, vec3(luma) * vec3(0.82, 0.92, 1.12), coolShift * 0.4);

    float heightAtten = mix(1.0, 0.45, smoothstep(0.0, 70.0, vWorldPos.y - uCamPos.y));
    float fogAmt = 1.0 - exp(-pow(dist * uFogDensity * heightAtten, 2.0) * 2.2);
    lit = mix(lit, uFogColor, clamp(fogAmt, 0.0, 1.0));

    gl_FragColor = vec4(lit, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export interface PeltPalette {
  base: string
  belly: string
  spot: string
}

const DEFAULT_PELT: PeltPalette = {
  base: '#b9c2d2', // smoky grey with a cool cast
  belly: '#eef2f7', // near-white underside
  spot: '#2f3440', // charcoal rosettes
}

// One shared material instance drives every part of the body. The hook keeps
// its uniforms locked onto the live atmosphere each frame, exactly as the
// terrain material does, so the leopard fogs and lights with the mountain.
export function useLeopardMaterial(palette: PeltPalette = DEFAULT_PELT) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uLightDir: { value: new THREE.Vector3(60, 90, -40).normalize() },
        uLightColor: { value: new THREE.Color('#f4c896') },
        uLightI: { value: 1.0 },
        uAmbColor: { value: new THREE.Color('#9db4d6') },
        uAmbI: { value: 0.5 },
        uFogColor: { value: new THREE.Color('#070e1a') },
        uFogDensity: { value: 0.0042 },
        uCamPos: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(palette.base) },
        uBellyColor: { value: new THREE.Color(palette.belly) },
        uSpotColor: { value: new THREE.Color(palette.spot) },
        uRimColor: { value: new THREE.Color('#f6bd84') },
        uRimStrength: { value: 0.4 },
        uOpacity: { value: 0 },
      },
      transparent: true,
    })
    // palette is intentionally fixed for the experience's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(({ camera, clock }) => {
    const u = material.uniforms
    const sun = atmo.sun
    // Mirror the camera-relative directional rig in World.tsx.
    u.uLightDir.value.set(60 - sun * 30, 90 - sun * 60, -40 - sun * 160).normalize()
    u.uLightColor.value.copy(atmo.dirLight)
    u.uLightI.value = atmo.dirIntensity
    u.uAmbColor.value.copy(atmo.skyHorizon).lerp(atmo.skyTop, 0.4)
    u.uAmbI.value = atmo.ambIntensity
    u.uFogColor.value.copy(atmo.fog)
    u.uFogDensity.value = atmo.fogDensity
    u.uCamPos.value.copy(camera.position)
    u.uTime.value = clock.elapsedTime
    // The rim ignites with the sunrise — faint under stars, blazing at the top.
    u.uRimColor.value.copy(atmo.dirLight)
    u.uRimStrength.value = 0.28 + sun * 1.05
    // The guardian is the last thing to resolve at the summit: it gathers out
    // of the dawn light only once the landscape, peaks and sunrise have landed.
    u.uOpacity.value = smoothstep(0.93, 0.99, journey.p)
  })

  return material
}
