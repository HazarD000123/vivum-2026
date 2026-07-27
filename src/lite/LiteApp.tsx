import { FormEvent, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { REGIONS, type RegionLocation } from '../worlds/data'
import { useCountdown } from '../festival'
import { setLitePreference } from './liteMode'
import './LiteApp.css'

// The lite experience: every word of the immersive site, as a plain, fast,
// keyboard- and screen-reader-friendly document — no WebGL, no scroll-jacking.
// Served to reduced-motion users by default, and one tap away for anyone.

const REGION_ORDER = ['sports', 'cultural', 'radioshack'] as const

const STATS = [
  ['15+', 'years on the mountain'],
  ['3 000+', 'climbers each season'],
  ['₹50L+', 'carried down for charity'],
  ['60+', 'trials along the route'],
]

function Countdown() {
  const t = useCountdown()
  const pad = (n: number) => String(n).padStart(2, '0')
  const units: Array<[number, string]> = [
    [t.days, 'DAYS'],
    [t.hours, 'HRS'],
    [t.minutes, 'MIN'],
    [t.seconds, 'SEC'],
  ]
  return (
    <div className="lite__countdown" role="timer" aria-label="Countdown to Vivum 2026">
      {units.map(([v, label]) => (
        <div key={label} className="lite__unit">
          <span className="lite__unit-value">{pad(v)}</span>
          <span className="lite__unit-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function NotifyForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }
  if (submitted) {
    return <p className="lite__manifest">You&rsquo;re on the manifest. We&rsquo;ll signal you from the summit.</p>
  }
  return (
    <form className="lite__form" onSubmit={onSubmit}>
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
      />
      <button type="submit">Join the expedition</button>
    </form>
  )
}

// Reveals its children with a soft fade-and-rise the first time they scroll
// into view. Reduced-motion visitors get the content instantly, no animation.
function Reveal({
  children,
  className = '',
  delay = 0,
  style,
}: {
  children: ReactNode
  className?: string
  delay?: number
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`reveal${shown ? ' is-in' : ''} ${className}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// A small monochrome glyph per landmark kind — for the compact card icons.
function KindIcon({ kind }: { kind: string }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'stage')
    return (
      <svg {...p}>
        <path d="M4 14V11M8.5 14V7.5M14 14V9.5M18.5 14V6M3 14h18" />
      </svg>
    )
  if (kind === 'pavilion')
    return (
      <svg {...p}>
        <path d="M4 20v-8a8 8 0 0 1 16 0v8M3 20h18" />
      </svg>
    )
  if (kind === 'installation')
    return (
      <svg {...p}>
        <path d="M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6z" />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M4 19l5-10 4 7 2-3 5 6z" />
    </svg>
  )
}

// A compact, tappable card — the details live in the popout, not on the page.
function EventCard({ loc, onOpen }: { loc: RegionLocation; onOpen: (l: RegionLocation) => void }) {
  return (
    <button className="lite-card" onClick={() => onOpen(loc)}>
      <span className="lite-card__icon">
        <KindIcon kind={loc.kind} />
      </span>
      <span className="lite-card__body">
        <span className="lite-card__name">{loc.name}</span>
        <span className="lite-card__sub">
          {loc.date} · {loc.venue}
        </span>
      </span>
      <span className="lite-card__chevron" aria-hidden>
        ›
      </span>
    </button>
  )
}

// The popout: a single event's full details in a centered dialog.
function EventModal({ loc, onClose }: { loc: RegionLocation | null; onClose: () => void }) {
  useEffect(() => {
    if (!loc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [loc, onClose])

  if (!loc) return null

  // Find parent region for links
  const region = Object.values(REGIONS).find((r) => r.locations.some((l) => l.id === loc.id))

  return (
    <div className="lite-modal" onClick={onClose}>
      <div
        className="lite-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label={loc.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lite-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="lite-ev__kind">{loc.kindLabel}</p>
        <h3 className="lite-modal__name">{loc.name}</h3>
        <p className="lite-modal__tagline">{loc.tagline}</p>
        <p className="lite-modal__desc">{loc.description}</p>
        <div className="lite-ev__meta">
          <div className="lite-ev__meta-item">
            <span className="lite-ev__meta-label">Date</span>
            <span className="lite-ev__meta-val">{loc.date}</span>
          </div>
          <div className="lite-ev__meta-item">
            <span className="lite-ev__meta-label">Venue</span>
            <span className="lite-ev__meta-val">{loc.venue}</span>
          </div>
        </div>
        <ul className="lite-ev__rules">
          {loc.rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
        {region?.links && region.links.length > 0 && (
          <div className="lite-modal__links">
            {region.links.map((link, i) => (
              <a
                key={i}
                className="lite-link-btn"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{link.label}</span>
                <span className="lite-link-btn__arrow">↗</span>
              </a>
            ))}
          </div>
        )}
        <span className={`lite-ev__stamp${loc.registrationOpen ? ' is-open' : ''}`}>
          {loc.registration}
        </span>
      </div>
    </div>
  )
}

export default function LiteApp({ onReady }: { onReady?: () => void }) {
  const [active, setActive] = useState<RegionLocation | null>(null)

  useEffect(() => {
    document.title = 'VIVUM 2026 — The International School Bangalore'
    onReady?.()
  }, [onReady])

  // Leave lite mode, optionally landing in a specific region world.
  const enterFull = (hash = '') => {
    setLitePreference(false)
    if (hash) window.location.hash = hash
  }

  return (
    <div className="lite">
      <header className="lite__bar">
        <span className="lite__wordmark">VIVUM &rsquo;26</span>
        <button className="lite__enter" onClick={() => enterFull()}>
          Enter the full experience →
        </button>
      </header>

      <main className="lite__main">
        <section className="lite__hero">
          <p className="lite__tag">THE INTERNATIONAL SCHOOL BANGALORE · PEAK 5 642 M</p>
          <h1 className="lite__title">VIVUM 2026</h1>
          <p className="lite__slogan">Conquer the Peaks</p>
          <p className="lite__lede">
            India&rsquo;s largest student-led charity festival. One weekend, thousands of
            climbers, all in service of a cause greater than ourselves.
          </p>
          <Countdown />
          <p className="lite__cta">Be the first to know when registrations open.</p>
          <NotifyForm />
        </section>

        <section className="lite__section">
          <h2>Every legend starts in the dark.</h2>
          <p>
            Vivum is the annual flagship inter-school festival of The International School
            Bangalore. One weekend. Thousands of students from across India. All of it in
            service of a cause greater than ourselves.
          </p>
          <p>
            A convergence of creativity, competition, culture and compassion — from
            high-energy contests to soulful performances, from workshops to lifelong
            friendships. Vivum is not just a festival. It is a movement.
          </p>
          <p className="lite__spirit">
            This year, Vivum takes on the spirit of the snow leopard — silent, sovereign,
            impossibly graceful.
          </p>
        </section>

        <section className="lite__section">
          <h2 className="lite__h2-mono">Expedition records</h2>
          <dl className="lite__stats">
            {STATS.map(([n, label]) => (
              <div key={label}>
                <dt>{n}</dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="lite__section">
          <h2 className="lite__h2-mono">Our cause</h2>
          <h3 className="lite__cause-name">
            Sri Jayadeva Institute of Cardiovascular Sciences and Research
          </h3>
          <p>
            Vivum is a charity festival. Funds raised this year support the paediatric division
            of Sri Jayadeva — a premier government cardiac-care institute in Bengaluru — helping
            pay for life-saving open-heart surgeries for children in need, regardless of
            background.
          </p>
        </section>

        <section className="lite__section">
          <h2 className="lite__h2-mono">The programme</h2>
          <p>
            Every event, with its full rules, venue and dates — tap a card to open the details.
          </p>

          {REGION_ORDER.map((id) => {
            const r = REGIONS[id]
            if (!r) return null
            return (
              <Reveal key={id} className="lite-region">
                <p className="lite__region-tag">{r.tag}</p>
                <h3 className="lite-region__name">{r.name}</h3>
                <p className="lite-region__world">{r.worldName}</p>
                <p className="lite-region__intro">{r.intro}</p>
                {r.protocol && (
                  <div className="lite-region__protocol">
                    <p className="lite-region__protocol-title">{r.protocol.title}</p>
                    <ul>
                      {r.protocol.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.links && r.links.length > 0 && (
                  <div className="lite-region__links">
                    {r.links.map((link, i) => (
                      <a
                        key={i}
                        className="lite-link-btn"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{link.label}</span>
                        <span className="lite-link-btn__arrow">↗</span>
                      </a>
                    ))}
                  </div>
                )}
                <div className="lite-card-grid">
                  {r.locations.map((loc) => (
                    <EventCard key={loc.id} loc={loc} onOpen={setActive} />
                  ))}
                </div>
                <button className="lite-region__3d" onClick={() => enterFull(`#/${id}`)}>
                  Explore {r.worldName} in 3D →
                </button>
              </Reveal>
            )
          })}

          <div className="lite-card lite-card--static">
            <span className="lite-card__icon">
              <KindIcon kind="pavilion" />
            </span>
            <span className="lite-card__body">
              <span className="lite-card__name">Registrations</span>
              <span className="lite-card__sub">
                Opening early — join the manifest above to be notified
              </span>
            </span>
            <span className="lite-ev__stamp is-open">Soon</span>
          </div>
        </section>

        <section className="lite__section">
          <h2 className="lite__h2-mono">Our sponsors</h2>
          <p>The patrons who keep the lanterns burning from base camp to the peak.</p>
          <p>
            <a className="lite__foot-link" href="#/sponsors">
              See our sponsors →
            </a>
          </p>
        </section>
      </main>

      <footer className="lite__foot">
        <p>In aid of the Sri Jayadeva Institute of Cardiovascular Sciences.</p>
        <p>13 &amp; 14 August 2026 — registrations open soon.</p>
        <p>
          Contact{' '}
          <a className="lite__foot-link" href="mailto:vivum26@tisb.ac.in">
            vivum26@tisb.ac.in
          </a>
        </p>
        <p>© 2026 Vivum, TISB · The International School Bangalore</p>
      </footer>

      <EventModal loc={active} onClose={() => setActive(null)} />
    </div>
  )
}
