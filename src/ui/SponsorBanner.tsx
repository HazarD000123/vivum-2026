import { useEffect, useState } from 'react'
import './SponsorBanner.css'

// The first sponsor banner to go live — a small, dismissible popup that sits
// on top of the home page. More sponsors will join this treatment later; for
// now it's a single static slot for Black Poetry.
const DISMISS_KEY = 'vivum:sponsorBannerDismissed'
const SHOW_DELAY_MS = 1400

export default function SponsorBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="sponsor-banner" role="dialog" aria-label="Sponsor announcement">
      <button className="sponsor-banner__close" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
      <p className="sponsor-banner__tag">PROUDLY SPONSORED BY</p>
      <img
        className="sponsor-banner__logo"
        src="/sponsors/black-poetry.png"
        alt="Black Poetry"
      />
    </div>
  )
}
