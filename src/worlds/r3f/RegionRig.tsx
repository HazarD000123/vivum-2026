import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { HeightField, RegionPoses } from '../regionMath'

// ---------------------------------------------------------------------------
// The region camera: no scroll here — travel. The rig holds one ideal pose
// and flies between poses along an arced, eased path whenever the nav target
// changes. On top of the ideal pose it layers idle drift, pointer parallax
// and a gentle focal-length change, so the camera always feels handheld and
// alive rather than mounted on rails.
// ---------------------------------------------------------------------------

export interface RegionNav {
  seq: number
  target: number | null
  /** Debug (?snap): travel completes in a single frame, for screenshots. */
  snap?: boolean
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export default function RegionRig({
  poses,
  field,
  nav,
  onArrive,
}: {
  poses: RegionPoses
  field: HeightField
  nav: RegionNav
  onArrive: (idx: number | null) => void
}) {
  const v = useMemo(
    () => ({
      curPos: new THREE.Vector3(...poses.intro.pos),
      curLook: new THREE.Vector3(...poses.intro.look),
      fromPos: new THREE.Vector3(),
      fromLook: new THREE.Vector3(),
      toPos: new THREE.Vector3(),
      toLook: new THREE.Vector3(),
      finalPos: new THREE.Vector3(),
      finalLook: new THREE.Vector3(),
    }),
    [poses],
  )
  const travel = useRef({
    t: 1,
    dur: 1,
    lift: 0,
    active: false,
    target: null as number | null,
    seq: -1,
  })
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 })
  const reduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame(({ camera, clock }, dt) => {
    const tr = travel.current

    // A new destination was requested — snapshot the current pose and go.
    if (nav.seq !== tr.seq) {
      tr.seq = nav.seq
      const pose = nav.target === null ? poses.overview : poses.locations[nav.target]
      v.fromPos.copy(v.curPos)
      v.fromLook.copy(v.curLook)
      v.toPos.set(...pose.pos)
      v.toLook.set(...pose.look)
      const dist = v.fromPos.distanceTo(v.toPos)
      tr.dur = nav.snap ? 0.001 : reduced ? 0.5 : THREE.MathUtils.clamp(dist * 0.02, 1.6, 4.0)
      // Arc the path upward — enough for drama, and always enough to clear
      // whatever terrain stands between here and there.
      const midY = (v.fromPos.y + v.toPos.y) / 2
      const ground = field((v.fromPos.x + v.toPos.x) / 2, (v.fromPos.z + v.toPos.z) / 2)
      tr.lift = Math.max(8 + dist * 0.08, ground + 16 - midY)
      tr.t = 0
      tr.active = true
      tr.target = nav.target
    }

    if (tr.active) {
      tr.t = Math.min(1, tr.t + dt / tr.dur)
      const e = easeInOutCubic(tr.t)
      v.curPos.lerpVectors(v.fromPos, v.toPos, e)
      v.curPos.y += tr.lift * Math.sin(Math.PI * e)
      // The gaze leads the body slightly — you look where you're going first.
      const eL = easeInOutCubic(Math.min(1, tr.t * 1.18))
      v.curLook.lerpVectors(v.fromLook, v.toLook, eL)
      if (tr.t >= 1) {
        tr.active = false
        onArrive(tr.target)
      }
    }

    const t = clock.elapsedTime
    const focused = tr.target !== null
    const p = pointer.current
    p.sx += (p.x - p.sx) * Math.min(1, dt * 2.4)
    p.sy += (p.y - p.sy) * Math.min(1, dt * 2.4)
    const par = focused ? 1.1 : 2.6
    const drift = focused ? 0.35 : 1

    v.finalPos.set(
      v.curPos.x + Math.sin(t * 0.16) * 1.4 * drift + p.sx * par,
      v.curPos.y + Math.sin(t * 0.5) * 0.3 * drift - p.sy * par * 0.5,
      v.curPos.z,
    )
    camera.position.copy(v.finalPos)
    v.finalLook.set(
      v.curLook.x + p.sx * par * 1.6 + Math.sin(t * 0.11) * 1.2 * drift,
      v.curLook.y - p.sy * par * 1.1,
      v.curLook.z,
    )
    camera.lookAt(v.finalLook)

    // Focus narrows onto the destination — a quiet push-in of focal length.
    const persp = camera as THREE.PerspectiveCamera
    const targetFov = focused ? 47 : 55
    if (Math.abs(persp.fov - targetFov) > 0.01) {
      persp.fov += (targetFov - persp.fov) * Math.min(1, dt * 1.6)
      persp.updateProjectionMatrix()
    }
  })

  return null
}
