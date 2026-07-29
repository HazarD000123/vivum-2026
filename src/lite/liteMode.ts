// ---------------------------------------------------------------------------
// Lite mode: a calm, static, WebGL-free version of the site for reduced-motion
// users, low-end devices, screen readers, and anyone who just wants the facts.
//
// The preference is event-driven (like the router's navigate) so any component
// can switch modes without prop-drilling — the Root listens and re-renders.
// ---------------------------------------------------------------------------

export const LITE_EVENT = 'vivum:lite-change'
const STORE_KEY = 'vivum:lite'

// Decide the initial mode. Default is ALWAYS the full immersive experience —
// lite only appears when explicitly asked for, via the `?lite=1` URL flag or a
// previous "Switch to lite version" choice (saved in localStorage). We do NOT
// auto-switch on the OS reduced-motion setting, so a visitor with that enabled
// still lands on the full site by default (they can opt into lite from the menu).
export function detectLite(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('lite') === '1') return true
    if (q.get('lite') === '0' || q.get('full') === '1') return false
    return localStorage.getItem(STORE_KEY) === '1'
  } catch {
    return false
  }
}

// Persist the choice and announce it; the Root swaps experiences in response.
export function setLitePreference(lite: boolean) {
  try {
    localStorage.setItem(STORE_KEY, lite ? '1' : '0')
  } catch {
    /* storage may be unavailable (private mode) — the event still fires */
  }
  window.dispatchEvent(new CustomEvent<boolean>(LITE_EVENT, { detail: lite }))
}
