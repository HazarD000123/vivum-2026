import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLeopardMaterial } from './leopardMaterial'
import type { LeopardState } from './useLeopardBehaviour'

// ---------------------------------------------------------------------------
// The body. Sculpted from grouped ellipsoids and tapered limbs into the pose
// snow leopards are most photographed in: sitting high on a ledge, upright and
// composed, the famously long, heavy tail curling up behind. Built facing +Z
// in its own local frame; the summit places and orients it.
//
// Every part that moves lives in a named group so the behaviour brain can drive
// it: the head swivels and tilts, the ears flick, the tail sways and snaps, the
// eyes blink, the ribcage breathes, and on rare occasions the whole front end
// rises or bows into a stretch.
// ---------------------------------------------------------------------------

const TAIL_SEGMENTS = 9
// Rest curl of the tail — each joint bends a little more, sweeping the heavy
// tail up off the rock and over into the high arc characteristic of the cat.
const TAIL_CURL = 0.30
const TAIL_LEN = 0.5

const _dir = new THREE.Vector3()
const _head = new THREE.Vector3()
const _q = new THREE.Quaternion()

function Ellipsoid({
  position,
  scale,
  rotation,
  material,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  rotation?: [number, number, number]
  material: THREE.Material
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={material} castShadow>
      <sphereGeometry args={[1, 20, 16]} />
    </mesh>
  )
}

export default function ProceduralLeopard({
  state,
  update,
}: {
  state: LeopardState
  update: (ctx: {
    t: number
    dt: number
    userYaw: number
    userPitch: number
    hovered: boolean
  }) => void
}) {
  const material = useLeopardMaterial()
  // Pale gold-green eyeshine — the same eyes that watched the whole climb.
  const eyeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#dff0c8', fog: false, transparent: true, opacity: 0.95 }),
    [],
  )
  const noseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a2730', roughness: 0.5, metalness: 0 }),
    [],
  )

  const root = useRef<THREE.Group>(null)
  const upper = useRef<THREE.Group>(null) // chest + neck + head + front legs (rises)
  const chest = useRef<THREE.Group>(null) // breathes
  const head = useRef<THREE.Group>(null)
  const earL = useRef<THREE.Group>(null)
  const earR = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const haunches = useRef<THREE.Group>(null)
  const tail = useRef<Array<THREE.Group | null>>([])
  const hovered = useRef(false)

  // Local position of the head, for aiming "look at the visitor".
  const headLocal = useMemo(() => new THREE.Vector3(0, 2.78, 1.55), [])

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const r = root.current
    if (!r) return

    // --- Where is the visitor, in the leopard's own frame? ---------------
    r.updateWorldMatrix(true, false)
    _head.copy(headLocal).applyMatrix4(r.matrixWorld)
    _dir.copy(camera.position).sub(_head).normalize()
    r.getWorldQuaternion(_q).invert()
    _dir.applyQuaternion(_q) // now in local space; forward is +Z
    const userYaw = Math.atan2(_dir.x, _dir.z)
    const userPitch = Math.asin(THREE.MathUtils.clamp(_dir.y, -1, 1))

    update({ t, dt, userYaw, userPitch, hovered: hovered.current })

    // --- Apply the brain to the body ------------------------------------
    r.rotation.y = state.turn

    if (head.current) {
      head.current.rotation.set(state.headPitch, state.headYaw, state.headRoll)
    }
    if (chest.current) {
      // Breathing: the ribcage swells, a touch more when standing/alert.
      const s = 1 + (state.breath - 0.5) * 0.05
      chest.current.scale.set(s, s, 1 + (state.breath - 0.5) * 0.03)
    }
    if (upper.current) {
      // Rise lifts the front end; stretch bows it forward and down.
      upper.current.position.y = state.rise * 0.55 - state.stretch * 0.2
      upper.current.position.z = state.stretch * 0.5
      upper.current.rotation.x = -state.rise * 0.12 + state.stretch * 0.34
    }
    if (legL.current && legR.current) {
      // Front legs straighten as the cat stands, reach forward in the stretch.
      const ext = state.rise * 0.22 + state.stretch * 0.16
      legL.current.rotation.x = -ext
      legR.current.rotation.x = -ext
    }
    if (haunches.current) {
      haunches.current.position.x = state.shift
      haunches.current.position.y = state.rise * 0.18
    }
    if (earL.current && earR.current) {
      // 0 = swivelled back and flat, 1 = perked forward and upright.
      earL.current.rotation.set(-state.earL * 0.5, 0.25 - state.earL * 0.35, 0.35 - state.earL * 0.3)
      earR.current.rotation.set(-state.earR * 0.5, -0.25 + state.earR * 0.35, -0.35 + state.earR * 0.3)
    }
    if (eyes.current) {
      eyes.current.scale.y = Math.max(0.06, state.eyeOpen)
    }
    // Tail: rest curl + a sway that grows toward the tip.
    for (let i = 0; i < TAIL_SEGMENTS; i++) {
      const seg = tail.current[i]
      if (!seg) continue
      const grow = 0.35 + i * 0.11
      seg.rotation.x = TAIL_CURL + state.tailLift * 0.12
      seg.rotation.y = state.tail * grow
      seg.rotation.z = Math.sin(t * 0.8 + i * 0.5) * 0.02 * grow
    }
  })

  // Build the nested tail chain once.
  const tailChain = useMemo(() => {
    const build = (i: number): React.ReactNode => {
      if (i >= TAIL_SEGMENTS) return null
      const rTail = 0.34 * (1 - i / (TAIL_SEGMENTS + 2)) + 0.06
      const rNext = 0.34 * (1 - (i + 1) / (TAIL_SEGMENTS + 2)) + 0.06
      return (
        <group
          key={i}
          ref={(el) => (tail.current[i] = el)}
          position={i === 0 ? [0, 0.7, -1.55] : [0, 0, TAIL_LEN]}
        >
          <mesh position={[0, 0, TAIL_LEN / 2]} rotation={[Math.PI / 2, 0, 0]} material={material}>
            <cylinderGeometry args={[rNext, rTail, TAIL_LEN * 1.08, 12]} />
          </mesh>
          {build(i + 1)}
        </group>
      )
    }
    return build(0)
    // material identity is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material])

  return (
    <group
      ref={root}
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
      {/* ---- Hindquarters: the seated base, low and broad ---------------- */}
      <group ref={haunches}>
        <Ellipsoid position={[0, 0.78, -0.95]} scale={[1.5, 1.25, 1.7]} material={material} />
        <Ellipsoid position={[0.6, 0.5, -0.55]} scale={[0.62, 0.85, 1.15]} material={material} />
        <Ellipsoid position={[-0.6, 0.5, -0.55]} scale={[0.62, 0.85, 1.15]} material={material} />
        {/* Rear paws tucked under */}
        <Ellipsoid position={[0.62, 0.12, 0.1]} scale={[0.34, 0.22, 0.62]} material={material} />
        <Ellipsoid position={[-0.62, 0.12, 0.1]} scale={[0.34, 0.22, 0.62]} material={material} />
        {tailChain}
      </group>

      {/* ---- Spine sloping up to the shoulders --------------------------- */}
      <Ellipsoid position={[0, 1.25, -0.1]} scale={[1.05, 1.0, 1.35]} rotation={[0.5, 0, 0]} material={material} />

      {/* ---- Front end: chest, neck, head, forelegs (rises as one) ------- */}
      <group ref={upper} position={[0, 0, 0]}>
        <group ref={chest}>
          <Ellipsoid position={[0, 1.55, 0.95]} scale={[1.0, 1.05, 0.95]} material={material} />
          {/* Cream chest blaze sits a touch proud of the body */}
          <Ellipsoid position={[0, 1.2, 1.35]} scale={[0.6, 0.7, 0.45]} material={material} />
        </group>

        {/* Forelegs — vertical pillars of the seated pose */}
        <group ref={legL} position={[0.42, 1.5, 1.2]}>
          <mesh position={[0, -0.72, 0.04]} material={material}>
            <cylinderGeometry args={[0.27, 0.22, 1.5, 12]} />
          </mesh>
          <Ellipsoid position={[0, -1.46, 0.2]} scale={[0.3, 0.2, 0.42]} material={material} />
        </group>
        <group ref={legR} position={[-0.42, 1.5, 1.2]}>
          <mesh position={[0, -0.72, 0.04]} material={material}>
            <cylinderGeometry args={[0.27, 0.22, 1.5, 12]} />
          </mesh>
          <Ellipsoid position={[0, -1.46, 0.2]} scale={[0.3, 0.2, 0.42]} material={material} />
        </group>

        {/* Neck */}
        <mesh position={[0, 2.15, 1.25]} rotation={[0.7, 0, 0]} material={material}>
          <cylinderGeometry args={[0.46, 0.6, 0.95, 14]} />
        </mesh>

        {/* ---- Head (swivels, tilts, blinks) --------------------------- */}
        <group ref={head} position={[0, 2.55, 1.42]}>
          {/* Cranium */}
          <Ellipsoid position={[0, 0.2, 0.05]} scale={[0.72, 0.66, 0.74]} material={material} />
          {/* Heavy cheek ruff — part of the snow leopard's broad-faced look */}
          <Ellipsoid position={[0.5, 0.0, 0.05]} scale={[0.3, 0.42, 0.42]} material={material} />
          <Ellipsoid position={[-0.5, 0.0, 0.05]} scale={[0.3, 0.42, 0.42]} material={material} />
          {/* Muzzle */}
          <Ellipsoid position={[0, 0.02, 0.62]} scale={[0.42, 0.36, 0.4]} material={material} />
          {/* Nose */}
          <mesh position={[0, 0.05, 0.96]} material={noseMat}>
            <sphereGeometry args={[0.1, 12, 10]} />
          </mesh>
          {/* Eyes — pale, watchful */}
          <group ref={eyes}>
            <mesh position={[0.27, 0.26, 0.66]} material={eyeMaterial}>
              <sphereGeometry args={[0.11, 14, 12]} />
            </mesh>
            <mesh position={[-0.27, 0.26, 0.66]} material={eyeMaterial}>
              <sphereGeometry args={[0.11, 14, 12]} />
            </mesh>
          </group>
          {/* Ears — short and rounded, swivel with the brain */}
          <group ref={earL} position={[0.4, 0.62, -0.05]}>
            <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0]} material={material}>
              <coneGeometry args={[0.26, 0.42, 5]} />
            </mesh>
          </group>
          <group ref={earR} position={[-0.4, 0.62, -0.05]}>
            <mesh position={[0, 0.18, 0]} material={material}>
              <coneGeometry args={[0.26, 0.42, 5]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
