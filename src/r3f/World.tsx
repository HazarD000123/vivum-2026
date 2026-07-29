import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { atmo, journey, remap, sampleAtmo } from '../journey'
import { trailHeight, zAt } from './terrainMath'
import Terrain from './Terrain'
import DistantRanges from './DistantRanges'
import Sky from './Sky'
import Snow from './Snow'
import Aurora from './Aurora'
import Clouds from './Clouds'
import Volumetrics from './Volumetrics'
import TrailProps from './TrailProps'
import LeopardEyes from './LeopardEyes'
import SummitLeopard from './leopard/SummitLeopard'

// The camera rig: scroll does not move a page — it walks the trail. The
// camera advances along z, rides the terrain height, weaves gently, and
// shifts its gaze from the distant summit to the path to the sunrise.

export default function World() {
  const { scene } = useThree()
  const dirLight = useRef<THREE.DirectionalLight>(null)
  const hemiLight = useRef<THREE.HemisphereLight>(null)
  const smoothed = useRef<number | null>(null)
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const fog = new THREE.FogExp2('#070e1a', 0.0042)
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene])

  useFrame(({ camera, clock }, dt) => {
    // Damp the raw scroll value a touch for cinematic weight.
    const target = journey.p
    if (smoothed.current === null) smoothed.current = target
    smoothed.current += (target - smoothed.current) * Math.min(1, dt * 5)
    const p = smoothed.current
    const t = clock.elapsedTime

    sampleAtmo(p)

    // --- Camera position -------------------------------------------------
    const z = zAt(p)
    const weave = Math.sin(p * Math.PI * 4.2) * 3
    const bob = Math.sin(t * 1.1) * 0.07
    // Storm buffet: the wind leans on the camera, never throws it.
    const storm = remap(atmo.snow, 0.55, 1)
    const buffetX = storm * (Math.sin(t * 1.7) * 0.09 + Math.sin(t * 4.3 + 1.2) * 0.04)
    const buffetY = storm * Math.sin(t * 2.3 + 0.7) * 0.06
    camera.position.set(weave + buffetX, trailHeight(z) + 5.2 + bob + buffetY, z)

    // --- Gaze ------------------------------------------------------------
    // Arrival: eyes lifted to the distant summit. Climb: on the trail ahead.
    // Summit: out across the cloud sea toward the sunrise and aurora.
    const zAhead = z - 46
    const arrivalLift = (1 - remap(p, 0, 0.12)) * 30
    const summitGaze = remap(p, 0.86, 0.97)
    const baseY = trailHeight(zAhead) + 4.6
    lookTarget.set(
      weave * 0.4 + Math.sin(t * 0.23) * 1.2,
      baseY + arrivalLift + summitGaze * (camera.position.y + 14 - baseY),
      zAhead - summitGaze * 320,
    )
    camera.lookAt(lookTarget)
    // A whisper of roll in the storm — handheld, alive.
    camera.rotation.z += storm * Math.sin(t * 0.9 + 2.1) * 0.004

    // --- Atmosphere ------------------------------------------------------
    const fog = scene.fog as THREE.FogExp2 | null
    if (fog) {
      fog.color.copy(atmo.fog)
      fog.density = atmo.fogDensity
    }
    if (dirLight.current) {
      dirLight.current.color.copy(atmo.dirLight)
      dirLight.current.intensity = atmo.dirIntensity
      // The light source swings from high moonlight to a low sunrise ahead.
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
      // Sky bounce for the standard-material props (tents, cairns, flags).
      hemiLight.current.color.copy(atmo.skyHorizon).lerp(atmo.skyTop, 0.35)
      hemiLight.current.groundColor.copy(atmo.fog).multiplyScalar(0.55)
      hemiLight.current.intensity = atmo.ambIntensity * 1.15
    }
  })

  return (
    <>
      <hemisphereLight ref={hemiLight} color="#9db4d6" groundColor="#0a121f" intensity={0.3} />
      <directionalLight ref={dirLight} color="#88a8dc" intensity={0.5} position={[60, 90, -40]} />
      <Sky />
      <DistantRanges />
      <Terrain />
      <TrailProps />
      <LeopardEyes />
      <SummitLeopard />
      <Snow />
      <Clouds />
      <Volumetrics />
      <Aurora />
    </>
  )
}
