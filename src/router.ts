import { REGIONS } from './worlds/data'

// Tiny hash router. Region worlds live at #/<region-id> or #<region-id>;
// static pages live at #/contact, #contact, #/sponsors, #sponsors.
// Every other hash belongs to the main journey.

export function cleanHashId(): string {
  const h = window.location.hash.replace(/^#\/?/, '')
  return h.split(/[/?]/)[0]
}

export function regionIdFromHash(): string | null {
  const id = cleanHashId()
  return id in REGIONS ? id : null
}

// Static pages that live beside the region worlds.
const PAGES = new Set(['sponsors', 'contact'])

export function pageIdFromHash(): string | null {
  const id = cleanHashId()
  return PAGES.has(id) ? id : null
}

// Cinematic route change: the Root veils the screen first, then commits the hash.
export function navigate(to: string) {
  window.dispatchEvent(new CustomEvent('vivum:navigate', { detail: to }))
}

export function goBackToAscent() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigate('')
  }
}
