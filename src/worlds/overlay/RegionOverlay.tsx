import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../router'
import type { Region, RegionLocation } from '../data'
import type { RegionPhase } from '../RegionApp'
import './RegionOverlay.css'

// ---------------------------------------------------------------------------
// The region instruments: a header that names the world and offers the way
// back, an intro that greets the climber at the overlook, the route strip
// (the world map — where you are, what exists, where to go next), and the
// field log that unfolds beside a landmark once the camera arrives.
// ---------------------------------------------------------------------------

export default function RegionOverlay({
  region,
  phase,
  focusIdx,
  onTravel,
}: {
  region: Region
  phase: RegionPhase
  focusIdx: number | null
  onTravel: (idx: number | null) => void
}) {
  // The panel keeps showing the last location while it slides away.
  const [panelLoc, setPanelLoc] = useState<RegionLocation | null>(null)
  useEffect(() => {
    if (focusIdx !== null) setPanelLoc(region.locations[focusIdx])
  }, [focusIdx, region])

  const count = region.locations.length
  const open = phase === 'arrived' && focusIdx !== null
  const introOn = phase === 'overview' && focusIdx === null
  const loc = panelLoc

  const step = (dir: number) => {
    const from = focusIdx ?? (dir > 0 ? -1 : 0)
    onTravel((from + dir + count) % count)
  }

  return (
    <div className="rg-root" style={{ '--rg-accent': region.theme.accent } as CSSProperties}>
      <header className="rg-top">
        <span className="hud__wordmark">VIVUM '26</span>
        <span className="rg-top__name">
          {region.name} — {region.worldName.toUpperCase()}
        </span>
        <button className="rg-top__exit" onClick={() => navigate('expedition')}>
          ↩ RETURN TO THE ASCENT
        </button>
      </header>

      <div className={`rg-intro${introOn ? ' is-on' : ''}`}>
        <p className="tag">{region.tag}</p>
        <h1 className="rg-intro__title">{region.worldName}</h1>
        <p className="rg-intro__body">{region.intro}</p>
        {region.protocol && (
          <div className="rg-intro__protocol">
            <p className="rg-intro__protocol-title">{region.protocol.title}</p>
            <ul>
              {region.protocol.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {region.links && region.links.length > 0 && (
          <div className="rg-intro__links">
            {region.links.map((link, i) => (
              <a
                key={i}
                className="rg-link-btn"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{link.label}</span>
                <span className="rg-link-btn__arrow">↗</span>
              </a>
            ))}
          </div>
        )}
        <p className="rg-intro__hint">SELECT A LIGHT ON THE MOUNTAIN — OR FOLLOW THE ROUTE BELOW</p>
      </div>

      <nav className={`rg-route${phase === 'intro' ? '' : ' is-on'}`} aria-label={`${region.name} route`}>
        {region.locations.map((l, i) => (
          <button
            key={l.id}
            className={`rg-route__stop${focusIdx === i ? ' is-active' : ''}`}
            onClick={() => onTravel(i)}
          >
            <span className="rg-route__dot" aria-hidden />
            <span className="rg-route__name">{l.name}</span>
          </button>
        ))}
      </nav>

      <aside className={`rg-log${open ? ' is-open' : ''}`} aria-hidden={!open}>
        {loc && (
          <>
            <p className="tag">{loc.kindLabel} — FIELD ENTRY</p>
            <h2 className="rg-log__title">{loc.name}</h2>
            <p className="rg-log__tagline">{loc.tagline}</p>
            <p className="rg-log__body">{loc.description}</p>
            <dl className="rg-log__dossier">
              <div>
                <dt>DATE</dt>
                <dd>{loc.date}</dd>
              </div>
              <div>
                <dt>VENUE</dt>
                <dd>{loc.venue}</dd>
              </div>
              <div>
                <dt>RULES</dt>
                <dd>
                  <ul className="rg-log__rules">
                    {loc.rules.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            {region.links && region.links.length > 0 && (
              <div className="rg-log__links">
                {region.links.map((link, i) => (
                  <a
                    key={i}
                    className="rg-link-btn rg-link-btn--small"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{link.label}</span>
                    <span className="rg-link-btn__arrow">↗</span>
                  </a>
                ))}
              </div>
            )}
            {loc.registrationOpen && (
              <span className="stamp stamp--accent">
                {loc.registration}
              </span>
            )}
            <div className="rg-log__nav">
              <button onClick={() => step(-1)}>← PREV</button>
              <button className="rg-log__back" onClick={() => onTravel(null)}>
                RETURN TO OVERLOOK
              </button>
              <button onClick={() => step(1)}>NEXT →</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
