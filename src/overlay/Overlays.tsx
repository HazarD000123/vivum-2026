import { ReactNode } from 'react'
import { MotionValue, motion, useTransform } from 'framer-motion'
import { navigate } from '../router'
import { REGIONS } from '../worlds/data'
import { useCountdown } from '../festival'
import './Overlays.css'

// Information lives along the route — waypoints, field notes, carved stone,
// checkpoints — discovered as the climber passes, never stacked as sections.

type Band = [number, number, number, number]

function useBand(progress: MotionValue<number>, band: Band) {
  const opacity = useTransform(progress, band, [0, 1, 1, 0])
  const y = useTransform(progress, band, [36, 0, 0, -36])
  return { opacity, y }
}

function Layer({
  progress,
  band,
  align,
  interactive = false,
  children,
}: {
  progress: MotionValue<number>
  band: Band
  align: 'left' | 'right' | 'center'
  interactive?: boolean
  children: ReactNode
}) {
  const { opacity, y } = useBand(progress, band)
  const pointerEvents = useTransform(opacity, (v) => (interactive && v > 0.5 ? 'auto' : 'none'))
  return (
    <motion.div className={`ovl ovl--${align}`} style={{ opacity, pointerEvents }}>
      <motion.div className="ovl__inner" style={{ y }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Paw({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className="paw" style={style} aria-hidden>
      <ellipse cx="20" cy="26" rx="8" ry="6.5" />
      <ellipse cx="9" cy="16" rx="3.4" ry="4.4" />
      <ellipse cx="17" cy="11" rx="3.4" ry="4.6" />
      <ellipse cx="25" cy="11" rx="3.4" ry="4.6" />
      <ellipse cx="32" cy="16" rx="3.4" ry="4.4" />
    </svg>
  )
}

function Countdown() {
  const time = useCountdown()
  const pad = (n: number) => String(n).padStart(2, '0')
  const units = [
    { value: time.days, label: 'DAYS' },
    { value: time.hours, label: 'HRS' },
    { value: time.minutes, label: 'MIN' },
    { value: time.seconds, label: 'SEC' },
  ]
  return (
    <div className="summit__countdown" role="timer" aria-label="Countdown to Vivum 2026">
      {units.map(({ value, label }, i) => (
        <div key={label} className="summit__unit">
          <span className="summit__value">{pad(value)}</span>
          <span className="summit__unit-label">{label}</span>
          {i < units.length - 1 && <span className="summit__sep">:</span>}
        </div>
      ))}
    </div>
  )
}



/* ------------------------------------------------------------------ */
/*  The constellation snow leopard — revealed only at the summit       */
/* ------------------------------------------------------------------ */

// The guardian's head in profile, facing the sunrise — matched to the crest
// on the festival logo: sharp ears, heavy brow, deep muzzle, ragged cheek ruff.
const LEOPARD_PATHS = [
  // Crown: nape, up over both ears, down to the brow.
  'M78,206 L88,158 L98,118 L108,100 L116,64 L134,88 L146,90 L156,84 L174,50 L190,80 L206,88 L224,102',
  // Face: brow stop, short blunt muzzle, lips, chin, jawline — feline, not canine.
  'M224,102 L232,112 L244,124 L254,134 L252,144 L242,148 L246,158 L234,168 L222,180 L208,190 L196,198',
  // Cheek ruff: ragged fur from the jaw back to the nape.
  'M196,198 L180,214 L168,206 L152,226 L138,214 L118,230 L98,222 L78,206',
  // Whiskers, swept back from the muzzle.
  'M234,164 L196,170 M238,152 L200,150',
]

const LEOPARD_DOTS: Array<[number, number]> = [
  [78, 206], [88, 158], [98, 118], [108, 100], [116, 64], [134, 88], [146, 90],
  [156, 84], [174, 50], [190, 80], [206, 88], [224, 102],
  [232, 112], [244, 124], [254, 134], [252, 144], [242, 148], [246, 158],
  [234, 168], [222, 180], [208, 190], [196, 198],
  [180, 214], [168, 206], [152, 226], [138, 214], [118, 230], [98, 222],
  [196, 170], [200, 150],
]

const LEOPARD_SPOTS: Array<[number, number]> = [
  [150, 130], [170, 160], [128, 168], [110, 140], [160, 105], [120, 196],
]

function ConstellationLeopard({ progress }: { progress: MotionValue<number> }) {
  const draws = [
    useTransform(progress, [0.876, 0.898], [0, 1]),
    useTransform(progress, [0.882, 0.903], [0, 1]),
    useTransform(progress, [0.888, 0.908], [0, 1]),
    useTransform(progress, [0.893, 0.912], [0, 1]),
  ]
  const dotsOpacity = useTransform(progress, [0.888, 0.908], [0, 1])
  const spotsOpacity = useTransform(progress, [0.9, 0.918], [0, 0.55])

  return (
    <svg className="leopard" viewBox="0 0 360 280" aria-label="The snow leopard, drawn in stars">
      {LEOPARD_PATHS.map((d, i) => (
        <motion.path key={i} d={d} style={{ pathLength: draws[i] }} />
      ))}
      <motion.g style={{ opacity: dotsOpacity }}>
        {LEOPARD_DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.8} className="leopard__dot" />
        ))}
      </motion.g>
      <motion.g style={{ opacity: spotsOpacity }}>
        {LEOPARD_SPOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.3} className="leopard__spot" />
        ))}
      </motion.g>
      {/* The eye — the same eyes that watched the whole climb. */}
      <motion.circle cx={216} cy={120} r={2.6} className="leopard__eye" style={{ opacity: dotsOpacity }} />
      {/* The nose, a brighter star at the point of the profile. */}
      <motion.circle cx={253} cy={139} r={2.1} className="leopard__dot" style={{ opacity: dotsOpacity }} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  The six stages                                                     */
/* ------------------------------------------------------------------ */

export default function Overlays({ progress: p }: { progress: MotionValue<number> }) {
  // The summit never fades back out — the climber has earned it.
  // The summit resolves to fully solid quickly (by p≈0.915) and then STAYS
  // solid for the rest of the scroll — no long, faint fade-in that leaves the
  // text and buttons half-visible while you're reading them.
  const summitOpacity = useTransform(p, [0.875, 0.895], [0, 1])
  const summitPointer = useTransform(summitOpacity, (v) => (v > 0.5 ? 'auto' : 'none'))

  const titleOp = useTransform(p, [0.885, 0.902], [0, 1])
  const metaOp = useTransform(p, [0.893, 0.908], [0, 1])
  const footOp = useTransform(p, [0.906, 0.92], [0, 1])

  return (
    <>
      {/* STAGE 0 — LANDING / HERO VIVUM LOGO */}
      <Layer progress={p} band={[0.0, 0.0, 0.022, 0.042]} align="center">
        <div className="hero-landing">
          <div className="hero-landing__emblem">
            <img className="hero-landing__logo-img" src="/leopard-mark.png" alt="Vivum Logo" />
          </div>
          <h1 className="hero-landing__title">VIVUM 2026</h1>
          <p className="hero-landing__tag">THE INTERNATIONAL SCHOOL BANGALORE</p>
          <p className="hero-landing__sub">The Annual Flagship Inter-School Festival</p>
        </div>
      </Layer>

      {/* STAGE 1 — THE ARRIVAL */}
      <Layer progress={p} band={[0.046, 0.075, 0.095, 0.115]} align="center">
        <p className="tag">EXPEDITION LOG — ENTRY 01 · NIGHTFALL</p>
        <h1 className="arrival__title">The Ascent</h1>
        <p className="arrival__slogan">Conquer the Peaks</p>
        <p className="arrival__sub">
          Somewhere above the clouds, Vivum is waiting.
          <br />
          The only way is up.
        </p>
      </Layer>

      {/* STAGE 2 — BASE CAMP */}
      <Layer progress={p} band={[0.115, 0.148, 0.19, 0.222]} align="left">
        <div className="marker">
          <p className="tag">WAYPOINT 01 — BASE CAMP · 1 950 M</p>
          <h2 className="marker__title">
            Every legend starts <em>in the dark.</em>
          </h2>
          <p className="marker__body">
            Vivum is the annual flagship inter-school festival of The International School
            Bangalore. One weekend. Thousands of students from across India. All of it in
            service of a cause greater than ourselves.
          </p>
        </div>
      </Layer>

      <Layer progress={p} band={[0.21, 0.24, 0.262, 0.288]} align="right">
        <div className="marker marker--note">
          <p className="tag">FIELD NOTE</p>
          <p className="marker__body">
            Fresh tracks in the snow — large, unhurried, heading up.
            <br />
            We are not climbing alone.
          </p>
          <div className="paw-trail" aria-hidden>
            <Paw style={{ opacity: 0.85 }} />
            <Paw style={{ opacity: 0.6, transform: 'translateY(-10px) rotate(8deg)' }} />
            <Paw style={{ opacity: 0.4, transform: 'translateY(-22px) rotate(14deg)' }} />
            <Paw style={{ opacity: 0.22, transform: 'translateY(-36px) rotate(20deg)' }} />
          </div>
        </div>
      </Layer>

      {/* STAGE 3 — THE VALLEY */}
      <Layer progress={p} band={[0.295, 0.328, 0.358, 0.388]} align="left">
        <div className="marker marker--stone">
          <p className="tag">WAYPOINT 02 — THE VALLEY · 3 210 M</p>
          <h2 className="marker__title">
            Where purpose <em>meets celebration.</em>
          </h2>
          <p className="marker__body">
            A convergence of creativity, competition, culture and compassion. From
            high-energy contests to soulful performances, from workshops to lifelong
            friendships — Vivum is not just a festival. It is a movement.
          </p>
        </div>
      </Layer>

      <Layer progress={p} band={[0.385, 0.415, 0.442, 0.468]} align="center">
        <div className="cause">
          <p className="tag">OUR CAUSE — WHY WE CLIMB</p>
          <p className="cause__line">
            Every step is for the children of the
            <br />
            <em>Sri Jayadeva Institute of Cardiovascular Sciences.</em>
          </p>
          <p className="cause__body">
            Funds raised at Vivum help pay for life-saving open-heart surgeries for children
            in need — a second chance at life, whatever their background.
          </p>
        </div>
      </Layer>

      <Layer progress={p} band={[0.452, 0.48, 0.502, 0.524]} align="right">
        <div className="marker marker--stone">
          <p className="tag">EXPEDITION RECORDS — CARVED AT THE PASS</p>
          <dl className="records">
            <div><dt>15+</dt><dd>years on the mountain</dd></div>
            <div><dt>3 000+</dt><dd>climbers each season</dd></div>
            <div><dt>₹50L+</dt><dd>carried down for charity</dd></div>
            <div><dt>60+</dt><dd>trials along the route</dd></div>
          </dl>
        </div>
      </Layer>

      {/* STAGE 4 — THE EXPEDITION — the gateways into the category worlds */}
      <Layer progress={p} band={[0.505, 0.528, 0.542, 0.562]} align="left" interactive>
        <div className="checkpoint">
          <p className="tag">CHECKPOINT A · 4 100 M</p>
          <h3 className="checkpoint__title">Sports</h3>
          <p className="checkpoint__desc">
            Eight summits stand along the crucible — basketball to hockey. Choose your game.
          </p>
          <button className="checkpoint__enter" onClick={() => navigate('/sports')}>
            {REGIONS.sports.enterLabel} →
          </button>
        </div>
      </Layer>

      <Layer progress={p} band={[0.555, 0.578, 0.592, 0.612]} align="right" interactive>
        <div className="checkpoint">
          <p className="tag">CHECKPOINT B · 4 230 M</p>
          <h3 className="checkpoint__title">Cultural</h3>
          <p className="checkpoint__desc">
            Four stages on the ice — Battle of the Bands, Dance Wars, Masquerade, and Canvas to
            Composition.
          </p>
          <div className="checkpoint__links">
            <a
              className="checkpoint__link"
              href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jgbSOiU_hk2ePRxkXvnrgKYHdc4cd-FPvrQfigzveYBUQVhXTkUwU0tMTkkzQ1VKNUNYQzFMS1M4Qi4u"
              target="_blank"
              rel="noopener noreferrer"
            >
              Registration Form ↗
            </a>
            <a
              className="checkpoint__link"
              href="https://drive.google.com/file/d/1CN12JuuiAWVqjptmg-1GuUu2b842rlSQ/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Event Brochure ↗
            </a>
          </div>
          <button className="checkpoint__enter" onClick={() => navigate('/cultural')}>
            {REGIONS.cultural.enterLabel} →
          </button>
        </div>
      </Layer>

      <Layer progress={p} band={[0.605, 0.628, 0.642, 0.662]} align="left" interactive>
        <div className="checkpoint">
          <p className="tag">CHECKPOINT C · 4 350 M</p>
          <h3 className="checkpoint__title">Other Games &amp; Events</h3>
          <p className="checkpoint__desc">
            RadioShack Activities — test your strength, trivia, freestyle raps, lip syncs, and dance battles.
          </p>
          <div className="checkpoint__links">
            <a
              className="checkpoint__link"
              href="https://forms.cloud.microsoft/r/CPULku1c9D"
              target="_blank"
              rel="noopener noreferrer"
            >
              Registration Form ↗
            </a>
          </div>
          <button className="checkpoint__enter" onClick={() => navigate('/radioshack')}>
            {REGIONS.radioshack.enterLabel} →
          </button>
        </div>
      </Layer>

      {/* STAGE 5 — THE ICE RIDGE */}
      <Layer progress={p} band={[0.7, 0.722, 0.742, 0.764]} align="center">
        <p className="ridgeline">Above the clouds now.</p>
      </Layer>
      <Layer progress={p} band={[0.766, 0.788, 0.806, 0.826]} align="center">
        <p className="ridgeline">It has been watching the whole climb.</p>
      </Layer>
      <Layer progress={p} band={[0.832, 0.846, 0.856, 0.868]} align="center">
        <p className="ridgeline ridgeline--small">Almost there.</p>
      </Layer>

      {/* STAGE 6 — THE SUMMIT */}
      <motion.div
        className="ovl ovl--center ovl--summit"
        style={{ opacity: summitOpacity, pointerEvents: summitPointer }}
      >
        <div className="summit">
          <ConstellationLeopard progress={p} />
          <motion.p className="tag" style={{ opacity: titleOp }}>
            PEAK VIVUM · 5 642 M — YOU MADE THE ASCENT
          </motion.p>
          <motion.h2 className="summit__title" style={{ opacity: titleOp }}>
            VIVUM 2026
          </motion.h2>
          <motion.div style={{ opacity: metaOp }}>
            <p className="summit__meta">The International School Bangalore</p>
            <Countdown />
          </motion.div>
          <motion.div className="summit__links" style={{ opacity: footOp }}>
            <button className="summit__link" onClick={() => navigate('/sponsors')}>
              <span>Meet our sponsors →</span>
            </button>
            <a
              className="summit__link summit__link--tisb"
              href="https://tisb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="summit__tisb-img" src="/tisb-logo.png" alt="TISB Logo" />
              <span>TISB Website (tisb.org) ↗</span>
            </a>
            <a
              className="summit__link summit__link--insta"
              href="https://www.instagram.com/vivum_26/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>📷 Instagram (@vivum_26) ↗</span>
            </a>
          </motion.div>
          <motion.p className="summit__foot" style={{ opacity: footOp }}>
            The International School Bangalore · NAFL Valley, Whitefield – Sarjapur Road, Near Dommasandra Circle, Bengaluru - 562125
          </motion.p>
          <motion.p className="summit__foot" style={{ opacity: footOp }}>
            In aid of the Sri Jayadeva Institute of Cardiovascular Sciences · 13 &amp; 14 August 2026
          </motion.p>
          <motion.p className="summit__foot" style={{ opacity: footOp }}>
            Phone:&nbsp;
            <a className="summit__contact-link" href="tel:+918067235900">
              +91 80 6723 5900
            </a>
            &nbsp;· Email:&nbsp;
            <a className="summit__contact-link" href="mailto:vivum26@tisb.ac.in">
              vivum26@tisb.ac.in
            </a>
            &nbsp;· © 2026 Vivum, TISB
          </motion.p>
          <motion.p className="summit__foot" style={{ opacity: footOp, marginTop: '0.4rem', color: '#ffcf9c' }}>
            Website Created &amp; Designed by{' '}
            <a className="summit__contact-link" href="https://www.instagram.com/jyo3g/" target="_blank" rel="noopener noreferrer" style={{ color: '#ffcf9c', fontWeight: 600 }}>
              Jyotir (@jyo3g)
            </a>
          </motion.p>
        </div>
      </motion.div>
    </>
  )
}
