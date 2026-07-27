import { useRef, useState } from 'react'
import { MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion'
import { STAGES, altitudeAt, journey, stageIndexAt } from '../journey'
import Menu from './Menu'
import './Hud.css'

const formatAlt = (m: number) => `${m.toLocaleString('en-IN').replace(/,/g, ' ')} M`

// The expedition instruments: a wordmark, an altimeter that climbs with you,
// and the route line with its six waypoints.
export default function Hud({ progress }: { progress: MotionValue<number> }) {
  const altRef = useRef<HTMLSpanElement>(null)
  const [stageIndex, setStageIndex] = useState(() => stageIndexAt(progress.get()))

  useMotionValueEvent(progress, 'change', (v) => {
    if (altRef.current) altRef.current.textContent = formatAlt(altitudeAt(v))
    const idx = stageIndexAt(v)
    setStageIndex((prev) => (prev === idx ? prev : idx))
  })

  const routeFill = useTransform(progress, [0, 1], [0, 1])
  const hintOpacity = useTransform(progress, [0, 0.04], [1, 0])

  return (
    <>
      <header className="hud__top">
        <div className="hud__brand">
          <img className="hud__logo" src="/leopard-mark.png" alt="" aria-hidden="true" />
          <span className="hud__wordmark">VIVUM '26</span>
        </div>
      </header>

      <Menu />

      <aside className="hud__route">
        <div className="hud__track">
          <motion.div className="hud__track-fill" style={{ scaleY: routeFill }} />
          {STAGES.map((stage, i) => (
            <button
              key={stage.id}
              className={`hud__waypoint ${i <= stageIndex ? 'is-passed' : ''} ${i === stageIndex ? 'is-active' : ''}`}
              style={{ top: `${((stage.from + Math.min(stage.to, 0.985)) / 2) * 100}%` }}
              aria-label={`Go to ${stage.name}, ${stage.alt}`}
              onClick={() => journey.scrollTo?.((stage.from + stage.to) / 2)}
            >
              <span className="hud__waypoint-label">
                {stage.name}
                <span className="hud__waypoint-alt">{stage.alt}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <footer className="hud__bottom">
        <span ref={altRef} className="hud__alt">{formatAlt(altitudeAt(progress.get()))}</span>
        <span className="hud__stage">{STAGES[stageIndex].name.toUpperCase()}</span>
      </footer>

      <motion.div className="hud__hint" style={{ opacity: hintOpacity }}>
        <span>SCROLL TO BEGIN THE CLIMB</span>
        <span className="hud__hint-line" />
      </motion.div>
    </>
  )
}
