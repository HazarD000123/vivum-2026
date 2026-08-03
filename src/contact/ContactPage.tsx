import { useEffect } from 'react'
import { goBackToAscent } from '../router'
import './ContactPage.css'

export default function ContactPage({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'VIVUM 2026 — Contact Us | The International School Bangalore'
    onReady?.()
    return () => {
      document.title = prev
    }
  }, [onReady])

  return (
    <div className="contact-page">
      <header className="cp-top">
        <div className="cp-top__brand">
          <span className="cp-top__wordmark">VIVUM '26</span>
          <span className="cp-top__divider">|</span>
          <a
            className="cp-top__tisb-link"
            href="https://tisb.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="The International School Bangalore (tisb.org)"
          >
            <img className="cp-top__tisb-logo" src="/tisb-logo.png" alt="TISB Logo" />
            <span className="cp-top__tisb-text">TISB</span>
          </a>
        </div>
        <div className="cp-top__right">
          <a
            className="cp-top__insta-link"
            href="https://www.instagram.com/vivum_26/"
            target="_blank"
            rel="noopener noreferrer"
            title="Official Instagram (@vivum_26)"
          >
            📷 @vivum_26
          </a>
          <button className="cp-top__exit" onClick={() => goBackToAscent()}>
            ↩ RETURN TO THE ASCENT
          </button>
        </div>
      </header>

      <main className="cp-main">
        <div className="cp-card">
          <div className="cp-card__header">
            <a href="https://tisb.org/" target="_blank" rel="noopener noreferrer">
              <img className="cp-card__logo" src="/tisb-logo.png" alt="TISB Logo" />
            </a>
            <div>
              <p className="cp-card__tag">ORGANIZING COMMITTEE</p>
              <h1 className="cp-card__title">Contact Us</h1>
            </div>
          </div>

          <div className="cp-card__body">
            <div className="cp-section">
              <h2 className="cp-label">SCHOOL ADDRESS</h2>
              <p className="cp-address">
                <strong>The International School Bangalore</strong>
                <br />
                NAFL Valley, Whitefield – Sarjapur Road
                <br />
                Near Dommasandra Circle, Bengaluru - 562125, Karnataka, India
              </p>
              <a
                className="cp-btn cp-btn--map"
                href="https://maps.app.goo.gl/5yWboDsbzBJhke4j6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>📍 View on Google Maps</span>
                <span className="cp-arrow">↗</span>
              </a>
            </div>

            <div className="cp-section">
              <h2 className="cp-label">DIRECT CONTACT INFORMATION</h2>
              <div className="cp-info-grid">
                <div className="cp-info-box">
                  <span className="cp-info-title">School Landline Phone</span>
                  <a className="cp-link" href="tel:+918067235900">
                    +91 80 6723 5900
                  </a>
                </div>
                <div className="cp-info-box">
                  <span className="cp-info-title">Email Enquiries</span>
                  <a className="cp-link" href="mailto:vivum26@tisb.ac.in">
                    vivum26@tisb.ac.in
                  </a>
                </div>
              </div>
            </div>

            <div className="cp-section">
              <h2 className="cp-label">OFFICIAL PORTALS &amp; SOCIALS</h2>
              <div className="cp-socials">
                <a
                  className="cp-btn"
                  href="https://tisb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>🌐 TISB Main Website (tisb.org)</span>
                  <span className="cp-arrow">↗</span>
                </a>
                <a
                  className="cp-btn cp-btn--insta"
                  href="https://www.instagram.com/vivum_26/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>📷 Official Instagram (@vivum_26)</span>
                  <span className="cp-arrow">↗</span>
                </a>
              </div>
            </div>

            <div className="cp-section">
              <h2 className="cp-label">WEBSITE CREATOR &amp; DESIGNER</h2>
              <div className="cp-socials">
                <a
                  className="cp-btn"
                  style={{ borderColor: 'rgba(255, 195, 135, 0.45)', color: '#ffcf9c' }}
                  href="https://www.instagram.com/jyo3g/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>💻 Designed &amp; Developed by Jyotir (@jyo3g)</span>
                  <span className="cp-arrow">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <p className="cp-foot">
          © 2026 Vivum · The International School Bangalore. In aid of the Sri Jayadeva Institute
          of Cardiovascular Sciences.
        </p>
      </main>
    </div>
  )
}
