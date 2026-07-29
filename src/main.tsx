import { StrictMode, Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { REGIONS } from './worlds/data'
import { pageIdFromHash, regionIdFromHash } from './router'
import { LITE_EVENT, detectLite } from './lite/liteMode'
import Loader from './ui/Loader'
import './index.css'

// The heavy experiences are code-split: the entry payload is just the shell +
// loader, so the first paint is instant and three.js streams in only when the
// immersive ascent or a region world is actually shown. Reduced-motion users
// land on the lite page and never download the 3D engine at all.
import SponsorsPage from './sponsors/SponsorsPage'
import ContactPage from './contact/ContactPage'

const App = lazy(() => import('./App'))
const RegionApp = lazy(() => import('./worlds/RegionApp'))
const LiteApp = lazy(() => import('./lite/LiteApp'))

// How long the veil takes to swallow the screen before a world swap.
const VEIL_MS = 650

function Root() {
  const [regionId, setRegionId] = useState<string | null>(regionIdFromHash)
  const [pageId, setPageId] = useState<string | null>(pageIdFromHash)
  const [lite, setLite] = useState<boolean>(detectLite)
  const [veiled, setVeiled] = useState(true)
  const [ready, setReady] = useState(false)

  const onReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    const reveal = setTimeout(() => setVeiled(false), 120)

    const onNavigate = (e: Event) => {
      setVeiled(true)
      setTimeout(() => {
        const detail = (e as CustomEvent<string>).detail
        if (!detail || detail === 'ascent' || detail === 'expedition') {
          window.location.hash = ''
        } else if (detail.startsWith('/')) {
          window.location.hash = detail
        } else {
          window.location.hash = `/${detail}`
        }
      }, VEIL_MS)
    }
    const onHash = () => {
      const id = regionIdFromHash()
      setRegionId((prev) => (prev === id ? prev : id))
      const page = pageIdFromHash()
      setPageId((prev) => (prev === page ? prev : page))
      setTimeout(() => setVeiled(false), 180)
    }
    const onLite = (e: Event) => {
      // Switching experiences: re-arm the loader while the new one mounts.
      setReady(false)
      setLite((e as CustomEvent<boolean>).detail)
      window.scrollTo(0, 0)
    }

    window.addEventListener('vivum:navigate', onNavigate)
    window.addEventListener('hashchange', onHash)
    window.addEventListener(LITE_EVENT, onLite)
    return () => {
      clearTimeout(reveal)
      window.removeEventListener('vivum:navigate', onNavigate)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener(LITE_EVENT, onLite)
    }
  }, [])

  const region = regionId ? REGIONS[regionId] : null

  let content
  // Sponsors & Contact are static pages — safe for lite visitors too.
  if (pageId === 'sponsors') content = <SponsorsPage onReady={onReady} />
  else if (pageId === 'contact') content = <ContactPage onReady={onReady} />
  else if (lite) content = <LiteApp onReady={onReady} />
  else if (region) content = <RegionApp key={region.id} region={region} onReady={onReady} />
  else content = <App onReady={onReady} />

  return (
    <>
      <Suspense fallback={null}>{content}</Suspense>
      <Loader done={ready} />
      <div className={`route-veil${veiled ? ' is-on' : ''}`} aria-hidden />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
