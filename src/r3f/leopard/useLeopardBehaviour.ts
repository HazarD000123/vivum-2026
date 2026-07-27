import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// The mind of the guardian.
//
// A wild cat at rest is mostly still — conserving energy, watching. So this is
// not an animation loop; it is a scheduler of intentions. Small idle gestures
// fire on long, randomised timers; large behaviours fire very rarely. Nothing
// repeats on a visible cadence. The output is a bag of eased, continuous values
// the body reads every frame — plus a semantic `behaviour` label so a future
// GLB rig can crossfade named clips off the same brain.
// ---------------------------------------------------------------------------

export type Gaze = 'ahead' | 'sunrise' | 'mountains' | 'valley' | 'scan' | 'user'
export type Rare = 'none' | 'stand' | 'stretch' | 'turn' | 'survey'

export interface LeopardState {
  // Continuous, eased — consumed directly by the sculpt.
  breath: number // 0..1, the slow tide of the ribcage
  headYaw: number
  headPitch: number
  headRoll: number
  earL: number // 0 relaxed/back … 1 perked forward
  earR: number
  eyeOpen: number // 0 shut … 1 open
  tail: number // lateral tail angle (sway + flicks)
  tailLift: number // vertical tail set
  rise: number // 0 sitting … 1 standing
  stretch: number // 0 … 1 forward bow-stretch
  turn: number // extra body yaw (radians), for surveying / turning around
  shift: number // subtle lateral weight shift at the hips
  // Discrete — for a GLB animation mixer to map onto clips.
  behaviour: 'idle' | Rare
  gaze: Gaze
}

export interface BehaviourCtx {
  t: number // clock.elapsedTime
  dt: number // frame delta
  userYaw: number // head yaw that would face the camera (computed by the body)
  userPitch: number
  hovered: boolean
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const damp = (cur: number, target: number, rate: number, dt: number) =>
  cur + (target - cur) * Math.min(1, dt * rate)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// Resting yaw/pitch for each named gaze (radians, relative to body forward).
const GAZE: Record<Exclude<Gaze, 'user'>, [number, number]> = {
  ahead: [0.0, -0.02],
  sunrise: [0.2, 0.05],
  mountains: [-0.52, 0.07],
  valley: [-0.12, -0.3],
  scan: [0.4, 0.0],
}
// Weighted pool — the distant, calm gazes dominate; glancing at the user is rare.
const GAZE_POOL: Gaze[] = [
  'ahead', 'ahead', 'ahead', 'sunrise', 'sunrise', 'mountains', 'mountains',
  'valley', 'scan', 'user',
]

interface Internals {
  // scheduler clocks (absolute times the next event is due)
  tGaze: number
  tBlink: number
  tEar: number
  tTail: number
  tSniff: number
  tRare: number
  // transient gestures
  blinkStart: number
  earTwitch: number // which ear (-1 left, 1 right, 0 none) and its start
  earTwitchStart: number
  tailFlickStart: number
  sniffStart: number
  // rare behaviour timeline
  rare: Rare
  rareStart: number
  rareDur: number
  // smoothed hover memory (seconds remaining of "acknowledging you")
  hoverHold: number
  started: boolean
}

export function useLeopardBehaviour() {
  const state = useMemo<LeopardState>(
    () => ({
      breath: 0, headYaw: 0, headPitch: -0.02, headRoll: 0,
      earL: 0.45, earR: 0.45, eyeOpen: 1, tail: 0, tailLift: 0,
      rise: 0, stretch: 0, turn: 0, shift: 0, behaviour: 'idle', gaze: 'ahead',
    }),
    [],
  )

  const g = useMemo<Internals>(
    () => ({
      tGaze: 2, tBlink: 3, tEar: 4, tTail: 2.5, tSniff: 22, tRare: 26,
      blinkStart: -1, earTwitch: 0, earTwitchStart: -1, tailFlickStart: -1,
      sniffStart: -1, rare: 'none', rareStart: 0, rareDur: 0,
      hoverHold: 0, started: false,
    }),
    [],
  )

  // Eased gaze targets, mutated by the scheduler, chased by the head each frame.
  const target = useMemo(() => ({ yaw: 0, pitch: -0.02, roll: 0, earBase: 0.45 }), [])

  function update(ctx: BehaviourCtx) {
    const { t, dt, hovered } = ctx
    if (!g.started) {
      // Stagger the first events so nothing fires in lockstep at load.
      g.tGaze = t + rand(1, 3)
      g.tBlink = t + rand(1.5, 4)
      g.tEar = t + rand(3, 7)
      g.tTail = t + rand(2, 5)
      g.tSniff = t + rand(20, 40)
      g.tRare = t + rand(22, 45)
      g.started = true
    }

    // --- Breath: the constant, the thing that's always true of a live animal.
    state.breath = 0.5 + 0.5 * Math.sin(t * 0.9)

    // --- Hover memory: a glance at the visitor, held a beat after they leave.
    if (hovered) g.hoverHold = 2.4
    else g.hoverHold = Math.max(0, g.hoverHold - dt)
    const acknowledging = g.hoverHold > 0

    const inRare = g.rare !== 'none'

    // --- Gaze scheduling -------------------------------------------------
    if (acknowledging) {
      state.gaze = 'user'
      target.yaw = clamp(ctx.userYaw, -1.25, 1.25)
      target.pitch = clamp(ctx.userPitch, -0.35, 0.4)
      target.roll = 0.06 * Math.sin(t * 0.7) // a faint curious tilt
      target.earBase = 1.0 // ears swivel forward, locked on
    } else if (!inRare && t >= g.tGaze) {
      const pick = GAZE_POOL[(Math.random() * GAZE_POOL.length) | 0]
      state.gaze = pick
      if (pick !== 'user') {
        target.yaw = GAZE[pick][0]
        target.pitch = GAZE[pick][1]
      }
      target.roll = 0
      target.earBase = pick === 'user' || pick === 'scan' ? 0.8 : rand(0.35, 0.6)
      // Long holds — stillness is the point. The user gaze is brief.
      g.tGaze = t + (pick === 'user' ? rand(1.6, 2.6) : rand(4.5, 12))
    }
    if (state.gaze === 'user' && !acknowledging) {
      // A self-initiated glance at the visitor follows the live camera too.
      target.yaw = clamp(ctx.userYaw, -1.25, 1.25)
      target.pitch = clamp(ctx.userPitch, -0.35, 0.4)
    }

    // --- Blink (with the occasional double) ------------------------------
    if (t >= g.tBlink) {
      g.blinkStart = t
      g.tBlink = t + (Math.random() < 0.22 ? 0.22 : rand(2.4, 6.8))
    }
    const bt = t - g.blinkStart
    state.eyeOpen = g.blinkStart < 0 || bt > 0.18 ? 1 : 1 - Math.sin(clamp(bt / 0.18, 0, 1) * Math.PI)

    // --- Ears: a relaxed base set, plus quick independent twitches -------
    if (t >= g.tEar) {
      g.earTwitch = Math.random() < 0.5 ? -1 : 1
      g.earTwitchStart = t
      g.tEar = t + rand(2.5, 8)
    }
    const et = t - g.earTwitchStart
    const twitch = g.earTwitchStart < 0 || et > 0.3 ? 0 : Math.sin(clamp(et / 0.3, 0, 1) * Math.PI) * 0.5
    const earBaseL = target.earBase + (g.earTwitch < 0 ? twitch : 0)
    const earBaseR = target.earBase + (g.earTwitch > 0 ? twitch : 0)
    state.earL = damp(state.earL, earBaseL, 9, dt)
    state.earR = damp(state.earR, earBaseR, 9, dt)

    // --- Tail: a slow continuous sway, with rare sharper flicks ----------
    if (t >= g.tTail) {
      g.tailFlickStart = t
      g.tTail = t + rand(4, 13)
    }
    const ft = t - g.tailFlickStart
    const flick = g.tailFlickStart < 0 || ft > 0.9 ? 0 : Math.sin(ft / 0.9 * Math.PI) * Math.sin(ft * 26) * 0.5
    const sway = Math.sin(t * 0.55) * 0.12 + Math.sin(t * 0.23 + 1.3) * 0.06
    state.tail = damp(state.tail, sway + flick, 6, dt)

    // --- Sniff: head lifts a touch, nostrils working, a few quick bobs ---
    if (!inRare && !acknowledging && t >= g.tSniff) {
      g.sniffStart = t
      g.tSniff = t + rand(20, 48)
    }
    const st = t - g.sniffStart
    const sniffing = g.sniffStart >= 0 && st < 1.6
    const sniffPitch = sniffing ? Math.sin(clamp(st / 1.6, 0, 1) * Math.PI) * 0.12 + Math.sin(st * 9) * 0.02 : 0

    // --- Rare behaviours: stand, stretch, turn, survey -------------------
    if (!inRare && !acknowledging && t >= g.tRare) {
      const kinds: Rare[] = ['stand', 'stretch', 'turn', 'survey', 'stand', 'survey']
      g.rare = kinds[(Math.random() * kinds.length) | 0]
      g.rareStart = t
      g.rareDur = g.rare === 'stretch' ? 5.5 : g.rare === 'turn' ? 6.5 : g.rare === 'survey' ? 7 : 6
    }
    let riseT = 0, stretchT = 0, turnT = 0
    if (inRare) {
      const u = clamp((t - g.rareStart) / g.rareDur, 0, 1)
      // A smooth in/hold/out envelope so the gesture arrives and leaves gently.
      const env = Math.sin(clamp(u, 0, 1) * Math.PI)
      if (g.rare === 'stand') {
        riseT = env
        target.earBase = Math.max(target.earBase, 0.7)
      } else if (g.rare === 'stretch') {
        stretchT = env
      } else if (g.rare === 'turn') {
        // Rise, rotate to look the other way, settle — a slow reposition.
        riseT = env * 0.8
        turnT = Math.sin(clamp(u, 0, 1) * Math.PI) * 0.9
        target.yaw = 0
      } else if (g.rare === 'survey') {
        // Stand tall and pan a long, deliberate scan across the valley.
        riseT = env
        target.yaw = Math.sin(u * Math.PI * 2) * 0.5
        target.pitch = -0.05
        target.earBase = 0.85
      }
      if (u >= 1) {
        g.rare = 'none'
        g.tRare = t + rand(30, 85) // a long quiet again before the next
      }
    }
    state.behaviour = g.rare
    state.rise = damp(state.rise, riseT, 2.2, dt)
    state.stretch = damp(state.stretch, stretchT, 2.4, dt)
    state.turn = damp(state.turn, turnT, 2.0, dt)

    // --- Settle the head onto its target (slow, deliberate) --------------
    const headRate = acknowledging || state.gaze === 'user' ? 3.4 : 2.4
    const breathBob = (state.breath - 0.5) * 0.02
    state.headYaw = damp(state.headYaw, target.yaw, headRate, dt)
    state.headPitch = damp(state.headPitch, target.pitch + sniffPitch + breathBob, headRate, dt)
    state.headRoll = damp(state.headRoll, target.roll, 3, dt)

    // --- Idle weight shift at the hips -----------------------------------
    state.shift = Math.sin(t * 0.17) * 0.04 * (1 - state.rise)
    state.tailLift = state.rise * 0.25
  }

  return { state, update }
}
