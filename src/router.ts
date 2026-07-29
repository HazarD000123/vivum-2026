import { REGIONS } from './worlds/data'

// Tiny hash router. Region worlds live at #/<region-id>; every other hash
// (including the ascent's #basecamp-style stage deep links) belongs to the
// main journey.

export function regionIdFromHash(): string | null {
  const h = window.location.hash
  if (!h.startsWith('#/')) return null
  const id = h.slice(2).split(/[/?]/)[0]
  return id in REGIONS ? id : null
}

// Static pages that live beside the region worlds on the same hash scheme.
const PAGES = new Set(['sponsors', 'contact'])

export function pageIdFromHash(): string | null {
  const h = window.location.hash
  if (!h.startsWith('#/')) return null
  const id = h.slice(2).split(/[/?]/)[0]
  return PAGES.has(id) ? id : null
}

// Cinematic route change: the Root veils the screen first, then commits the
// hash — so worlds are always swapped behind the dark.
export function navigate(to: string) {
  window.dispatchEvent(new CustomEvent('vivum:navigate', { detail: to }))
}
