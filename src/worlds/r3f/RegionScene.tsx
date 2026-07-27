import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey } from '../../journey'
import Sky from '../../r3f/Sky'
import Snow from '../../r3f/Snow'
import Aurora from '../../r3f/Aurora'
import DistantRanges from '../../r3f/DistantRanges'
import RegionTerrain from './RegionTerrain'
import Landmark from './Landmarks'
import RegionRig from './RegionRig'
import type { RegionNav } from './RegionRig'
import { FrozenLake, LakeMist, Lanterns, LightTrail } from './RegionExtras'
import type { HeightField, RegionPoses } from '../regionMath'
import type { Region } from '../data'

// ---------------------------------------------------------------------------
// One reusable scene renders every category world. The region's theme is
// written into the shared `atmo` each frame, so the ascent's sky, snow,
// aurora and far ranges all re-dress themselves for the new climate without
// knowing anything changed.
// ---------------------------------------------------------------------------

export default function RegionScene({
  region,
  field,
  poses,
  nav,
  focusIdx,
  onArrive,
  onSelect,
}: {
  region: Region
  field: HeightField
  poses: RegionPoses
  nav: RegionNav
  focusIdx: number | null
  onArrive: (idx: number | null) => void
  onSelect: (idx: number) => void
}) {
  const { scene } = useThree()
  const theme = region.theme
  const dirLight = useRef<THREE.DirectionalLight>(null)
  const hemiLight = useRef<THREE.HemisphereLight>(null)

  const colors = useMemo(
    () => ({
      skyTop: new THREE.Color(theme.skyTop),
      skyHorizon: new THREE.Color(theme.skyHorizon),
      fog: new THREE.Color(theme.fog),
      dirLight: new THREE.Color(theme.dirLight),
    }),
    [theme],
  )

  useEffect(() => {
    // The shared Sky/Aurora read journey.p for their summit-content dimming —
    // park it at 0 while a region world is on screen.
    journey.p = 0
    const fog = new THREE.FogExp2(theme.fog, theme.fogDensity)
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, theme])

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime

    // The region's fixed climate, with a slow breath in the weather.
    atmo.skyTop.copy(colors.skyTop)
    atmo.skyHorizon.copy(colors.skyHorizon)
    atmo.fog.copy(colors.fog)
    atmo.dirLight.copy(colors.dirLight)
    atmo.dirIntensity = theme.dirIntensity
    atmo.ambIntensity = theme.ambIntensity
    atmo.fogDensity = theme.fogDensity
    atmo.snow = theme.snow * (0.85 + 0.15 * Math.sin(t * 0.13))
    atmo.stars = theme.stars
    atmo.aurora = theme.aurora * (0.8 + 0.2 * Math.sin(t * 0.07))
    atmo.sun = theme.sun

    const fog = scene.fog as THREE.FogExp2 | null
    if (fog) {
      fog.color.copy(atmo.fog)
      fog.density = atmo.fogDensity
    }
    // Same light rig as the ascent World — camera-relative, sun-aware.
    if (dirLight.current) {
      dirLight.current.color.copy(atmo.dirLight)
      dirLight.current.intensity = atmo.dirIntensity
      const sun = atmo.sun
      dirLight.current.position.set(
        camera.position.x + 60 - sun * 30,
        camera.position.y + 90 - sun * 60,
        camera.position.z - 40 - sun * 160,
      )
      dirLight.current.target.position.copy(camera.position)
      dirLight.current.target.updateMatrixWorld()
    }
    if (hemiLight.current) {
      hemiLight.current.color.copy(atmo.skyHorizon).lerp(atmo.skyTop, 0.35)
      hemiLight.current.groundColor.copy(atmo.fog).multiplyScalar(0.55)
      hemiLight.current.intensity = atmo.ambIntensity * 1.15
    }
  })

  const ys = useMemo(
    () => region.locations.map((l) => field(l.x, l.z)),
    [region, field],
  )

  return (
    <>
      <hemisphereLight ref={hemiLight} color="#9db4d6" groundColor="#0a121f" intensity={0.3} />
      <directionalLight
        ref={dirLight}
        color={theme.dirLight}
        intensity={theme.dirIntensity}
        position={[60, 90, -40]}
      />
      <Sky />
      <DistantRanges />
      <RegionTerrain field={field} terrain={theme.terrain} />
      <LightTrail region={region} field={field} />

      {theme.terrain === 'basin' && (
        <>
          <FrozenLake />
          <LakeMist />
        </>
      )}
      {theme.terrain === 'valley' && <Lanterns region={region} field={field} />}

      {region.locations.map((loc, i) => (
        <Landmark
          key={loc.id}
          loc={loc}
          y={ys[i]}
          accent={theme.accent}
          active={focusIdx === i}
          dimmed={focusIdx !== null && focusIdx !== i}
          onSelect={() => onSelect(i)}
        />
      ))}

      <Snow />
      <Aurora />
      <RegionRig poses={poses} field={field} nav={nav} onArrive={onArrive} />
    </>
  )
}
