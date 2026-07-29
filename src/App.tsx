import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion'
import Lenis from 'lenis'
import World from './r3f/World'
import Overlays from './overlay/Overlays'
import Hud from './ui/Hud'
import { STAGES, clamp01, journey } from './journey'

// One fixed world, one long scroll. The spacer below gives the journey its
// physical length; everything visible lives in the fixed layers above it.

const JOURNEY_LENGTH = '1500vh'

// Debug/preview mode: ?fix=0.42 freezes the journey at that progress
// without scrolling. Constant for the app's lifetime.
const FIX = (() => {
  const v = new URLSearchParams(window.location.search).get('fix')
  if (v === null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : clamp01(n)
})()

export default function App({ onReady }: { onReady?: () => void }) {
  const { scrollYProgress } = useScroll()
  const fixedProgress = useMotionValue(FIX ?? 0)
  const progress = FIX !== null ? fixedProgress : scrollYProgress

  useMotionValueEvent(progress, 'change', (v) => {
    journey.p = v
  })

  useEffect(() => {
    if (FIX !== null) journey.p = FIX
  }, [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.45,
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    journey.scrollTo = (p: number) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      lenis.scrollTo(p * max, { duration: 2.2 })
    }

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Deep links: #basecamp … #summit jump to a stage, ?p=0.5 to raw progress.
    const params = new URLSearchParams(window.location.search)
    const hashStage = STAGES.find((s) => s.id === window.location.hash.slice(1))
    const target = params.has('p')
      ? Number(params.get('p'))
      : hashStage
        ? (hashStage.from + hashStage.to) / 2
        : null
    if (target !== null && !Number.isNaN(target)) {
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        lenis.scrollTo(clamp01(target) * max, { immediate: true })
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      journey.scrollTo = null
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <div className="world">
        <Canvas
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          camera={{ fov: 55, near: 0.1, far: 2600, position: [0, 8, 12] }}
          onCreated={() => {
            // Hold the loader until the first frames have compiled their shaders.
            requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))
          }}
        >
          <World />
        </Canvas>
      </div>

      {/* Photographic finish: a breathing vignette and a whisper of grain. */}
      <div className="grade-vignette" aria-hidden />
      <div className="grade-grain" aria-hidden />

      <Hud progress={progress} />
      <Overlays progress={progress} />

      <div
        className="journey-spacer"
        style={{ height: FIX !== null ? '100vh' : JOURNEY_LENGTH }}
        aria-hidden
      />
    </>
  )
}
