import { useEffect } from 'react'
import { goBackToAscent } from '../router'
import { TIERS, type Sponsor } from './sponsors'
import './Sponsors.css'

// ---------------------------------------------------------------------------
// The patrons' page — a quiet, static ledger in the expedition's voice. No
// WebGL: it loads instantly for everyone, including lite-mode visitors. Real
// logos replace the placeholder slots as the committee confirms them (see
// sponsors.ts for the drop-in steps).
// ---------------------------------------------------------------------------

function Slot({ sponsor, tierId }: { sponsor: Sponsor; tierId: string }) {
  const inner = (
    <>
      <div className="sp-slot__logo-bg">
        <img className="sp-slot__logo" src={sponsor.logo} alt={sponsor.name} loading="lazy" />
      </div>
      <span className="sp-slot__name">{sponsor.name}</span>
    </>
  )
  const cls = `sp-slot sp-slot--${tierId}`
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
        <div className="sp-top__brand">
          <span className="sp-top__wordmark">VIVUM '26</span>
          <span className="sp-top__divider">|</span>
          <a
            className="sp-top__tisb-link"
            href="https://tisb.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="The International School Bangalore (tisb.org)"
          >
            <img className="sp-top__tisb-logo" src="/tisb-logo.png" alt="TISB Logo" />
            <span className="sp-top__tisb-text">TISB</span>
          </a>
        </div>
        <div className="sp-top__right">
          <a
            className="sp-top__insta-link"
            href="https://www.instagram.com/vivum_26/"
            target="_blank"
            rel="noopener noreferrer"
            title="Official Instagram (@vivum_26)"
          >
            📷 @vivum_26
          </a>
          <button className="sp-top__exit" onClick={() => goBackToAscent()}>
            ↩ RETURN TO THE ASCENT
          </button>
        </div>
      </header>

      <main className="sp-main">
        <p className="sp-tag">THE EXPEDITION LEDGER</p>
        <h1 className="sp-title">Sponsors</h1>
        <p className="sp-lede">
          No one summits alone. Vivum climbs on the backing of its patrons — the names below
          keep the lanterns burning from base camp to the peak.
        </p>

        {TIERS.map((tier) => (
          <section key={tier.id} className={`sp-tier sp-tier--${tier.id}`}>
            <div className="sp-tier__head">
              <h2 className="sp-tier__title">{tier.title}</h2>
              <p className="sp-tier__note">{tier.note}</p>
            </div>
            <div className={`sp-grid sp-grid--${tier.id}`}>
              {tier.slots.map((s, i) => (
                <Slot key={i} sponsor={s} tierId={tier.id} />
              ))}
            </div>
          </section>
        ))}

        <div className="sp-contact-box">
          <div className="sp-contact-box__header">
            <a href="https://tisb.org/" target="_blank" rel="noopener noreferrer">
              <img className="sp-contact-box__logo" src="/tisb-logo.png" alt="TISB Logo" />
            </a>
            <div>
              <p className="sp-contact-box__tag">THE INTERNATIONAL SCHOOL BANGALORE</p>
              <h3 className="sp-contact-box__title">Contact &amp; Sponsorships</h3>
            </div>
          </div>

          <p className="sp-contact-box__address">
            NAFL Valley, Whitefield – Sarjapur Road, Near Dommasandra Circle, Bengaluru - 562125, Karnataka, India
          </p>

          <div className="sp-contact-box__grid">
            <div>
              <span className="sp-contact-box__lbl">LANDLINE PHONE</span>
              <a className="sp-contact-box__val" href="tel:+918067235900">
                +91 80 6723 5900
              </a>
            </div>
            <div>
              <span className="sp-contact-box__lbl">EMAIL ENQUIRIES</span>
              <a className="sp-contact-box__val" href="mailto:vivum26@tisb.ac.in">
                vivum26@tisb.ac.in
              </a>
            </div>
          </div>

          <div className="sp-contact-box__btns">
            <a
              className="sp-contact-btn"
              href="https://maps.app.goo.gl/5yWboDsbzBJhke4j6"
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Google Maps Location ↗
            </a>
            <a
              className="sp-contact-btn sp-contact-btn--site"
              href="https://tisb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              🌐 Visit TISB Website (tisb.org) ↗
            </a>
            <a
              className="sp-contact-btn sp-contact-btn--insta"
              href="https://www.instagram.com/vivum_26/"
              target="_blank"
              rel="noopener noreferrer"
            >
              📷 Instagram (@vivum_26) ↗
            </a>
          </div>
        </div>

        <p className="sp-foot">
          Interested in backing the expedition? Reach the Vivum organizing committee through
          The International School Bangalore.
          <br />
          Contact{' '}
          <a className="sp-foot__link" href="mailto:vivum26@tisb.ac.in">
            vivum26@tisb.ac.in
          </a>
          &nbsp;· Landline:&nbsp;
          <a className="sp-foot__link" href="tel:+918067235900">
            +91 80 6723 5900
          </a>
          <br />
          Website Created &amp; Designed by{' '}
          <a className="sp-foot__link" href="https://www.instagram.com/jyo3g/" target="_blank" rel="noopener noreferrer" style={{ color: '#ffcf9c', fontWeight: 600 }}>
            Jyotir (@jyo3g)
          </a>
        </p>
      </main>
    </div>
  )
}
