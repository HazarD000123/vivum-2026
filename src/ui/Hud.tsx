import { useRef, useState } from 'react'
import { MotionValue, motion, useMotionValueEvent, useTransform } from 'framer-motion'
import { STAGES, altitudeAt, journey, stageIndexAt } from '../journey'
import { navigate } from '../router'
import Menu from './Menu'
import './Hud.css'

import ContactModal from './ContactModal'

const formatAlt = (m: number) => `${m.toLocaleString('en-IN').replace(/,/g, ' ')} M`

// The expedition instruments: a wordmark, an altimeter that climbs with you,
// and the route line with its six waypoints.
export default function Hud({ progress }: { progress: MotionValue<number> }) {
  const altRef = useRef<HTMLSpanElement>(null)
  const [stageIndex, setStageIndex] = useState(() => stageIndexAt(progress.get()))
  const [contactOpen, setContactOpen] = useState(false)

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
          <span className="hud__brand-divider" aria-hidden="true">|</span>
          <a
            className="hud__tisb-link"
            href="https://tisb.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="The International School Bangalore (tisb.org)"
          >
            <img className="hud__tisb-logo" src="/tisb-logo.png" alt="TISB Logo" />
            <span className="hud__tisb-text">TISB</span>
          </a>
        </div>

        <div className="hud__top-actions">
          <a
            className="hud__social-link"
            href="https://www.instagram.com/vivum_26/"
            target="_blank"
            rel="noopener noreferrer"
            title="Official Vivum Instagram (@vivum_26)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span className="hud__social-text">@vivum_26</span>
          </a>
          <button className="hud__contact-btn" onClick={() => navigate('contact')}>
            Contact Us
          </button>
        </div>
      </header>

      <Menu />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

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
