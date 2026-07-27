import { useEffect } from 'react'
import { navigate } from '../router'
import { TIERS, type Sponsor } from './sponsors'
import './Sponsors.css'

// ---------------------------------------------------------------------------
// The patrons' page — a quiet, static ledger in the expedition's voice. No
// WebGL: it loads instantly for everyone, including lite-mode visitors. Real
// logos replace the placeholder slots as the committee confirms them (see
// sponsors.ts for the drop-in steps).
// ---------------------------------------------------------------------------

function Paw() {
  return (
    <svg viewBox="0 0 40 40" className="sp-slot__paw" aria-hidden>
      <ellipse cx="20" cy="26" rx="8" ry="6.5" />
      <ellipse cx="9" cy="16" rx="3.4" ry="4.4" />
      <ellipse cx="17" cy="11" rx="3.4" ry="4.6" />
      <ellipse cx="25" cy="11" rx="3.4" ry="4.6" />
      <ellipse cx="32" cy="16" rx="3.4" ry="4.4" />
    </svg>
  )
}

function Slot({ sponsor, large }: { sponsor: Sponsor; large?: boolean }) {
  const cls = `sp-slot${large ? ' sp-slot--large' : ''}`
  if (!sponsor.name) {
    return (
      <div className={`${cls} sp-slot--empty`}>
        <Paw />
        <span className="sp-slot__soon">REVEALING SOON</span>
      </div>
    )
  }
  const inner = (
    <>
      {sponsor.logo && <img className="sp-slot__logo" src={sponsor.logo} alt={sponsor.name} />}
      <span className="sp-slot__name">{sponsor.name}</span>
    </>
  )
  return sponsor.url ? (
    <a className={cls} href={sponsor.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export default function SponsorsPage({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'VIVUM 2026 — Sponsors'
    onReady?.()
    return () => {
      document.title = prev
    }
  }, [onReady])

  return (
    <div className="sponsors">
      <header className="sp-top">
        <span className="sp-top__wordmark">VIVUM '26</span>
        <button className="sp-top__exit" onClick={() => navigate('expedition')}>
          ↩ RETURN TO THE ASCENT
        </button>
      </header>

      <main className="sp-main">
        <p className="sp-tag">THE EXPEDITION LEDGER</p>
        <h1 className="sp-title">Sponsors</h1>
        <p className="sp-lede">
          No one summits alone. Vivum climbs on the backing of its patrons — the names below
          keep the lanterns burning from base camp to the peak.
        </p>

        {TIERS.map((tier) => (
          <section key={tier.id} className="sp-tier">
            <div className="sp-tier__head">
              <h2 className="sp-tier__title">{tier.title}</h2>
              <p className="sp-tier__note">{tier.note}</p>
            </div>
            <div className={`sp-grid sp-grid--${tier.id}`}>
              {tier.slots.map((s, i) => (
                <Slot key={i} sponsor={s} large={tier.id === 'title'} />
              ))}
            </div>
          </section>
        ))}

        <p className="sp-foot">
          Interested in backing the expedition? Reach the Vivum organizing committee through
          The International School Bangalore.
          <br />
          Contact{' '}
          <a className="sp-foot__link" href="mailto:vivum26@tisb.ac.in">
            vivum26@tisb.ac.in
          </a>
        </p>
      </main>
    </div>
  )
}
