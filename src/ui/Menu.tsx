import { useEffect, useId, useRef, useState } from 'react'
import { STAGES, journey } from '../journey'
import { REGIONS } from '../worlds/data'
import { navigate } from '../router'
import { setLitePreference } from '../lite/liteMode'
import './Menu.css'

// The expedition map. The route rail shows where you are; this shows everywhere
// you can go — every stage, every region, and a straight line to register —
// so no one has to scroll the whole mountain to find a date or a sign-up.

const REGION_ORDER = ['sports', 'cultural', 'radioshack'] as const

export default function Menu() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const firstItem = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    // Move focus into the panel for keyboard users.
    firstItem.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const jumpTo = (p: number) => {
    journey.scrollTo?.(p)
    setOpen(false)
  }
  const enter = (id: string) => {
    navigate(`/${id}`)
    setOpen(false)
  }

  return (
    <div className="menu">
      <button className="menu__register" onClick={() => jumpTo(1)}>
        Register
      </button>
      <button
        className={`menu__toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open expedition map'}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      {open && <div className="menu__scrim" onClick={() => setOpen(false)} aria-hidden />}

      <nav
        id={panelId}
        className={`menu__panel${open ? ' is-open' : ''}`}
        aria-label="Expedition map"
        aria-hidden={!open}
      >
        <p className="menu__heading">The Ascent</p>
        <ul className="menu__list">
          {STAGES.map((s, i) => (
            <li key={s.id}>
              <button
                ref={i === 0 ? firstItem : undefined}
                className="menu__item"
                onClick={() => jumpTo(Math.min((s.from + s.to) / 2, 0.99))}
                tabIndex={open ? 0 : -1}
              >
                <span className="menu__item-name">{s.name}</span>
                <span className="menu__item-meta">{s.alt}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="menu__heading">Regions</p>
        <ul className="menu__list">
          {REGION_ORDER.map((id) => {
            const r = REGIONS[id]
            if (!r) return null
            return (
              <li key={id}>
                <button className="menu__item" onClick={() => enter(id)} tabIndex={open ? 0 : -1}>
                  <span className="menu__item-name">{r.name}</span>
                  <span className="menu__item-meta">{r.worldName}</span>
                </button>
              </li>
            )
          })}
          <li>
            <button
              className="menu__item is-muted"
              onClick={() => jumpTo(0.65)}
              tabIndex={open ? 0 : -1}
            >
              <span className="menu__item-name">Registrations</span>
              <span className="menu__item-meta">Opening early</span>
            </button>
          </li>
          <li>
            <button className="menu__item" onClick={() => enter('sponsors')} tabIndex={open ? 0 : -1}>
              <span className="menu__item-name">Sponsors</span>
              <span className="menu__item-meta">The expedition ledger</span>
            </button>
          </li>
        </ul>

        <div className="menu__actions">
          <button className="menu__action" onClick={() => jumpTo(1)} tabIndex={open ? 0 : -1}>
            Skip to the summit →
          </button>
          <button
            className="menu__action menu__action--quiet"
            onClick={() => setLitePreference(true)}
            tabIndex={open ? 0 : -1}
          >
            Switch to lite version
          </button>
        </div>

        <a
          className="menu__credit"
          href="https://instagram.com/jyo3g"
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={open ? 0 : -1}
        >
          <span>Made by @jyo3g</span>
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <rect x="2" y="2" width="20" height="20" rx="5.5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.6" cy="6.4" r="1.2" className="menu__credit-dot" />
          </svg>
        </a>
      </nav>
    </div>
  )
}
