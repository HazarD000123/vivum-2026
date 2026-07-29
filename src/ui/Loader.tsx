import { useEffect, useState } from 'react'
import './Loader.css'

// The threshold. Holds the dark over the screen while the heavy 3D chunk
// streams in and the first frame compiles, then dissolves — so the climber
// never sees a blank canvas or a shader stutter. `done` fades it out; it
// unmounts itself once the fade completes.
export default function Loader({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(id)
  }, [done])

  if (gone) return null

  return (
    <div className={`loader${done ? ' is-done' : ''}`} role="status" aria-live="polite">
      <div className="loader__mark">VIVUM &rsquo;26</div>
      <div className="loader__bar" aria-hidden>
        <span className="loader__bar-fill" />
      </div>
      <div className="loader__label">PREPARING THE ASCENT</div>
      <span className="loader__sr">Loading the Vivum 2026 experience</span>
    </div>
  )
}
