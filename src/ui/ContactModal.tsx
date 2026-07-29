import { useEffect } from 'react'
import './ContactModal.css'

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="contact-modal" onClick={onClose}>
      <div
        className="contact-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label="Contact Vivum 2026 & TISB"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="contact-modal__close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="contact-modal__header">
          <a href="https://tisb.org/" target="_blank" rel="noopener noreferrer" title="Visit TISB Main Website">
            <img className="contact-modal__tisb-logo" src="/tisb-logo.png" alt="TISB Logo" />
          </a>
          <div>
            <p className="contact-modal__tag">ORGANIZING COMMITTEE</p>
            <h2 className="contact-modal__title">Contact Us</h2>
          </div>
        </div>

        <div className="contact-modal__body">
          <div className="contact-modal__section">
            <h3 className="contact-modal__label">SCHOOL ADDRESS</h3>
            <p className="contact-modal__address">
              <strong>The International School Bangalore</strong>
              <br />
              NAFL Valley, Whitefield
              <br />
              Bangalore - 560066, Karnataka, India
            </p>
            <a
              className="contact-modal__map-btn"
              href="https://maps.app.goo.gl/5yWboDsbzBJhke4j6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>📍 View on Google Maps</span>
              <span className="contact-modal__arrow">↗</span>
            </a>
          </div>

          <div className="contact-modal__section">
            <h3 className="contact-modal__label">DIRECT CONTACT</h3>
            <div className="contact-modal__info-grid">
              <div>
                <span className="contact-modal__info-title">Landline Phone</span>
                <a className="contact-modal__link" href="tel:+918067235900">
                  +91 80 6723 5900
                </a>
              </div>
              <div>
                <span className="contact-modal__info-title">Email Enquiries</span>
                <a className="contact-modal__link" href="mailto:vivum26@tisb.ac.in">
                  vivum26@tisb.ac.in
                </a>
              </div>
            </div>
          </div>

          <div className="contact-modal__section">
            <h3 className="contact-modal__label">OFFICIAL PORTALS</h3>
            <div className="contact-modal__socials">
              <a
                className="contact-modal__social-btn"
                href="https://tisb.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>🌐 TISB Main Website (tisb.org)</span>
                <span className="contact-modal__arrow">↗</span>
              </a>
              <a
                className="contact-modal__social-btn contact-modal__social-btn--insta"
                href="https://www.instagram.com/vivum_26/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>📷 Official Instagram (@vivum_26)</span>
                <span className="contact-modal__arrow">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
