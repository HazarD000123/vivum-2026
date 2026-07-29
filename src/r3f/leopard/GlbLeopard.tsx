import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { LeopardState } from './useLeopardBehaviour'

// ---------------------------------------------------------------------------
// The drop-in path. The moment a rigged, animated `/leopard.glb` exists, the
// summit loads it instead of the sculpt — driven by the *same* behaviour brain.
//
// We can't know a future model's clip names, so behaviours map onto clips by
// keyword, falling back to an idle/first clip when a match is missing. Head aim
// is applied additively to a bone matched by name, for the "looks at the
// visitor" glance — guarded so it never throws on a model that lacks one.
// ---------------------------------------------------------------------------

// behaviour label → keywords to look for in the GLB's clip names.
const CLIP_KEYWORDS: Record<string, string[]> = {
  idle: ['idle', 'rest', 'sit', 'breath'],
  stand: ['stand', 'getup', 'rise', 'up'],
  stretch: ['stretch', 'yawn'],
  turn: ['turn', 'rotate'],
  survey: ['survey', 'look', 'walk', 'prowl'],
}

function pickClip(names: string[], behaviour: string): string | null {
  const keys = CLIP_KEYWORDS[behaviour] ?? CLIP_KEYWORDS.idle
  for (const k of keys) {
    const hit = names.find((n) => n.toLowerCase().includes(k))
    if (hit) return hit
  }
  return null
}

const _q = new THREE.Quaternion()
const _dir = new THREE.Vector3()
const _head = new THREE.Vector3()

export default function GlbLeopard({
  src,
  state,
  update,
}: {
  src: string
  state: LeopardState
  update: (ctx: {
    t: number
    dt: number
    userYaw: number
    userPitch: number
    hovered: boolean
  }) => void
}) {
  const group = useRef<THREE.Group>(null)
  const hovered = useRef(false)
  const { scene, animations } = useGLTF(src)
  const { actions, names } = useAnimations(animations, group)
  const current = useRef<string | null>(null)

  // The head bone, for additive aim. Best-effort by name.
  const headBone = useMemo(() => {
    let found: THREE.Object3D | null = null
    scene.traverse((o) => {
      if (!found && /head|neck/i.test(o.name)) found = o
    })
    return found as THREE.Object3D | null
  }, [scene])
  const idleName = useMemo(
    () => pickClip(names, 'idle') ?? names[0] ?? null,
    [names],
  )

  // Crossfade to whichever clip matches the current behaviour.
  function play(name: string | null) {
    const target = name ?? idleName
    if (!target || current.current === target) return
    const next = actions[target]
    if (!next) return
    const prev = current.current ? actions[current.current] : null
    next.reset().fadeIn(0.6).play()
    prev?.fadeOut(0.6)
    current.current = target
  }

  useEffect(() => {
    play(idleName)
    return () => {
      Object.values(actions).forEach((a) => a?.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, idleName])

  useFrame(({ camera, clock }, dt) => {
    const g = group.current
    if (!g) return
    g.updateWorldMatrix(true, false)
    _head.setFromMatrixPosition(headBone ? headBone.matrixWorld : g.matrixWorld)
    _dir.copy(camera.position).sub(_head).normalize()
    g.getWorldQuaternion(_q).invert()
    _dir.applyQuaternion(_q)
    const userYaw = Math.atan2(_dir.x, _dir.z)
    const userPitch = Math.asin(THREE.MathUtils.clamp(_dir.y, -1, 1))

    update({ t: clock.elapsedTime, dt, userYaw, userPitch, hovered: hovered.current })

    g.rotation.y = state.turn
    play(state.behaviour === 'idle' ? idleName : pickClip(names, state.behaviour))

    // Additive head aim — only bites on clips that leave the head free.
    if (headBone) {
      headBone.rotation.y += (state.headYaw - headBone.rotation.y) * Math.min(1, dt * 3)
      headBone.rotation.x += (state.headPitch - headBone.rotation.x) * Math.min(1, dt * 3)
    }
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        hovered.current = true
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hovered.current = false
        document.body.style.cursor = ''
      }}
    >
      <primitive object={scene} />
    </group>
  )
}
