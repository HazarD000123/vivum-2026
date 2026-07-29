import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// The one place the festival date lives. Both the immersive summit and the
// lite fallback read it from here, so there is a single placeholder to confirm
// before launch (see the project memo).
// ---------------------------------------------------------------------------

// Vivum 2026 runs 13–14 August. The countdown targets the festival start:
// 9:00 AM IST on the 13th. (Schools are advised to arrive by 7:00 AM.)
export const TARGET_DATE = new Date('2026-08-13T09:00:00+05:30')

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getTimeLeft(): TimeLeft {
  const diff = TARGET_DATE.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

// Ticks once a second. Shared by the summit countdown and the lite hero.
export function useCountdown(): TimeLeft {
  const [time, setTime] = useState(getTimeLeft)
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}
