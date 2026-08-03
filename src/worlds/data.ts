// ---------------------------------------------------------------------------
// Category worlds — each major checkpoint of the ascent opens into its own
// region of the mountain system. Content here is the real Vivum 2026
// programme as confirmed by the organizing committee; anything still being
// finalised is marked TO BE ANNOUNCED and can be filled in without touching
// the rendering system. A region supports any number of locations.
// ---------------------------------------------------------------------------

export type LandmarkKind =
  | 'lodge'
  | 'camp'
  | 'beacon'
  | 'pavilion'
  | 'station'
  | 'summit'
  | 'stage'
  | 'installation'

export interface RegionLocation {
  id: string
  name: string
  kind: LandmarkKind
  kindLabel: string
  /** World placement on the region's ground plane. */
  x: number
  z: number
  tagline: string
  description: string
  date: string
  venue: string
  rules: string[]
  registration: string
  registrationOpen: boolean
}

export interface RegionTheme {
  skyTop: string
  skyHorizon: string
  fog: string
  dirLight: string
  dirIntensity: number
  ambIntensity: number
  fogDensity: number
  snow: number
  stars: number
  aurora: number
  sun: number
  /** Signature light color of the region — beacons, trails, UI accents. */
  accent: string
  terrain: 'valley' | 'ridge' | 'basin'
}

export interface RegionLink {
  label: string
  url: string
  kind?: 'registration' | 'brochure' | 'external'
}

export interface Region {
  id: string
  name: string
  worldName: string
  tag: string
  intro: string
  enterLabel: string
  /** Ground rules that apply to every location in the region. */
  protocol?: { title: string; items: string[] }
  theme: RegionTheme
  locations: RegionLocation[]
  links?: RegionLink[]
}

// Every event runs across both festival days (August 13–14). Committee asked
// for just the days on event cards — match fixtures aren't exact yet.
const DATES = '13TH & 14TH AUGUST'
const SOON = 'REGISTRATION OPENS SOON'

/* ------------------------------------------------------------------ */
/*  SPORTS — The Crucible Ridge                                        */
/* ------------------------------------------------------------------ */

const SPORTS: Region = {
  id: 'sports',
  name: 'SPORTS',
  worldName: 'The Crucible Ridge',
  tag: 'REGION 01 — THE CRUCIBLE RIDGE · 4 700 M',
  intro:
    'Past the valley the weather turns and the route sharpens. Eight summits stand along the crucible — courts, fields and tables where every school tests its edge. Whether you are an experienced player or just starting out, pick your game and start the climb.',
  enterLabel: 'CLIMB THE CRUCIBLE RIDGE',
  protocol: {
    title: 'GROUND RULES — ALL SPORTS',
    items: [
      'Age Category: Grade 12 and below.',
      'All teams follow the established rules and regulations to ensure fair competition.',
      'Punctuality is essential — teams arriving beyond a 15-minute grace period are disqualified.',
      'Protests must be submitted in writing to the organizing committee within 30 minutes of the game’s conclusion, with a fee of Rs. 1000/- (not refunded if the protest is ruled against).',
      'Report to TISB for registration at least 20 minutes before your scheduled event, and be at your venue 15 minutes before start.',
      'All schools are advised to arrive at TISB by 7:00 AM on 13th August.',
      'Special prizes for winners, with certificates and trophies for most events.',
    ],
  },
  theme: {
    skyTop: '#040a18',
    skyHorizon: '#28384e',
    fog: '#1b2434',
    dirLight: '#b6cce8',
    dirIntensity: 0.8,
    ambIntensity: 0.4,
    fogDensity: 0.0042,
    snow: 0.6,
    stars: 0.35,
    aurora: 0,
    sun: 0,
    accent: '#ff7a5c',
    terrain: 'ridge',
  },
  locations: [
    {
      id: 'basketball',
      name: 'Basketball',
      kind: 'summit',
      kindLabel: 'SUMMIT I · 4 480 M',
      x: 35, z: -130,
      tagline: 'High altitude, hard court.',
      description:
        'Feel the heat on the court as top teams clash in an intense battle of skill, speed and strategy! Fast breaks, sharp shots and fierce defense make this basketball tournament an absolute highlight.',
      date: DATES,
      venue: 'Basketball Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Each team consists of 5 players on court and up to 7 substitutes.',
        'FIBA rules apply, with official match durations.',
        'Four quarters of 8 minutes running time (stop-clock in the final 2 minutes of the 4th quarter).',
        'Single-elimination knockout format.',
        '5 personal fouls lead to disqualification.',
        'Team fouls reset every quarter; bonus free throws apply after the 4th team foul.',
        'The referee’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'football',
      name: 'Football',
      kind: 'summit',
      kindLabel: 'SUMMIT II · 4 560 M',
      x: 95, z: -170,
      tagline: 'The beautiful game, at altitude.',
      description:
        'Get the crowd fired up! Each year, hundreds of students gather on our home ground to cheer on the beautiful game and show their school spirit in a thrilling clash.',
      date: DATES,
      venue: 'Football Field & Turf Ground',
      rules: [
        'Age Category: Grade 12 and below.',
        'FIFA rules, with a few exceptions.',
        '20-minute halves with a 5-minute half-time break.',
        'Knockout tournament.',
        'If the score is a draw, the match goes directly to penalty shoot-outs.',
        'Goalkeepers wear a different colour jersey — bibs provided if needed.',
        '5 substitutes per squad in 11-a-side matches.',
        'The referee’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'volleyball',
      name: 'Volleyball',
      kind: 'summit',
      kindLabel: 'SUMMIT III · 4 640 M',
      x: 45, z: -210,
      tagline: 'The net at the top of the world.',
      description:
        'With quick spikes, precise sets and agile dives, the players show off their skill and teamwork on the court. The energy is electric as the ball moves swiftly over the net, powered by speed, control and sharp reflexes.',
      date: DATES,
      venue: 'Volleyball Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Each team fields six players on the court.',
        'Team strength: 12.',
        'Rally scoring — best of 3 games, 25 points each.',
        'Held as per FIVB rules, on a knockout basis.',
        'The referee’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'tennis',
      name: 'Tennis',
      kind: 'summit',
      kindLabel: 'SUMMIT IV · 4 700 M',
      x: 110, z: -255,
      tagline: 'One court, thin air, no margins.',
      description:
        'Join us for intense matches, fast-paced rallies and unforgettable moments of victory. Experience the excitement, skill and sportsmanship that make this highly anticipated tennis event one you won’t want to miss.',
      date: DATES,
      venue: 'Tennis Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Knockout tournament.',
        '3 matches per round: First Singles, Doubles, Second Singles.',
        'Best of 7 games — at 3-all, the tie-breaker applies.',
        'Held on the basis of ITF rules.',
        'Team strength: 4.',
        'The referee’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'table-tennis',
      name: 'Table Tennis',
      kind: 'summit',
      kindLabel: 'SUMMIT V · 4 760 M',
      x: 65, z: -300,
      tagline: 'Millimetres decide at altitude.',
      description:
        'Catch the lightning-fast action of the table tennis tournament! Intense matchups, sharp plays and thrilling rallies unfold in a showcase of pure agility and precision. Don’t miss this much-awaited event!',
      date: DATES,
      venue: 'Table Tennis Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Knockout tournament.',
        'Best of 5 games, 11 points each.',
        '3 matches per round: First Singles, Doubles, Second Singles.',
        'Held as per TTFI rules.',
        'Team strength: 4.',
        'The umpire’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'badminton',
      name: 'Badminton',
      kind: 'summit',
      kindLabel: 'SUMMIT VI · 4 820 M',
      x: 100, z: -340,
      tagline: 'Featherlight, ruthless.',
      description:
        'Rackets up. Smashes, drops and deceptive net play — badminton at Vivum is a showcase of speed, touch and nerve, decided at the very last point.',
      date: DATES,
      venue: 'Badminton Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Team size: 4 members.',
        'Shuttlecock: Mavis 350 synthetic.',
        'Knockout tournament.',
        '3 matches per round: First Singles, Doubles, Second Singles.',
        'Matches are played to 30 points — at 29–29, whoever takes the next point wins the match.',
        'Held on the basis of BWF rules.',
        'The umpire’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'throwball',
      name: 'Throwball',
      kind: 'summit',
      kindLabel: 'SUMMIT VII · 4 900 M',
      x: 40, z: -385,
      tagline: 'Caught clean, or lost to the wind.',
      description:
        'Dive into the action with fast throws, sharp reflexes and unbeatable teamwork. Throwball at Vivum promises nonstop excitement and fierce competition — get ready to bring your best!',
      date: DATES,
      venue: 'Volleyball Court',
      rules: [
        'Age Category: Grade 12 and below.',
        'Knockout tournament.',
        'Best of 3 games, 15 points each.',
        'Held on the basis of TAI rules.',
        'Team strength: 12.',
        'The umpire’s call is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'hockey',
      name: 'Hockey',
      kind: 'summit',
      kindLabel: 'SUMMIT VIII · 4 980 M',
      x: 85, z: -430,
      tagline: 'Sticks out on the highest ice.',
      description:
        'What could feel better than clashing sticks and sending the ball soaring into the net? Join us to witness an exhilarating competition as the girls fiercely charge forward with unstoppable energy!',
      date: DATES,
      venue: 'Hockey Field',
      rules: [
        'Age Category: Grade 12 and below.',
        'Rolling substitutions can be made.',
        'Match duration: 45 minutes (20–5–20).',
        'Team strength: 11-a-side with 5 substitutes.',
        'Held as per FIH rules, on a knockout basis.',
        'The referee’s decision is final.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
  ],
}

/* ------------------------------------------------------------------ */
/*  CULTURAL — The Aurora Basin                                        */
/* ------------------------------------------------------------------ */

const CULTURAL: Region = {
  id: 'cultural',
  name: 'CULTURAL',
  worldName: 'The Aurora Basin',
  tag: 'REGION 02 — THE AURORA BASIN · 3 600 M',
  intro:
    'East of the route the mountains open into a still basin, where the lights come down to the ice. Four lights burn tonight — Battle of the Bands, Dance Wars, Masquerade and Canvas to Composition. Walk softly; sound carries here.',
  enterLabel: 'DESCEND TO THE AURORA BASIN',
  links: [
    {
      label: 'Cultural Registration Form',
      url: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jgbSOiU_hk2ePRxkXvnrgKYHdc4cd-FPvrQfigzveYBUQVhXTkUwU0tMTkkzQ1VKNUNYQzFMS1M4Qi4u',
      kind: 'registration',
    },
    {
      label: 'Cultural Event Brochure',
      url: 'https://drive.google.com/file/d/1CN12JuuiAWVqjptmg-1GuUu2b842rlSQ/view?usp=sharing',
      kind: 'brochure',
    },
  ],
  theme: {
    skyTop: '#030817',
    skyHorizon: '#16263c',
    fog: '#0d1828',
    dirLight: '#a8c8da',
    dirIntensity: 0.5,
    ambIntensity: 0.46,
    fogDensity: 0.002,
    snow: 0.05,
    stars: 1,
    aurora: 1,
    sun: 0,
    accent: '#8ef0c8',
    terrain: 'basin',
  },
  locations: [
    {
      id: 'battle-of-the-bands',
      name: 'Battle of the Bands',
      kind: 'stage',
      kindLabel: 'GRAND ICE STAGE',
      x: -46, z: -148,
      tagline: 'Every school, one amplifier.',
      description:
        'The basin’s loudest night. Bands from every school on the mountain bring their own sound — and their own instruments — to a single stage, twelve minutes at a time.',
      date: DATES,
      venue: 'Main Auditorium',
      rules: [
        'Team event with 5–7 participants per team.',
        'Maximum of 15 teams.',
        'All performers in a team must be from the same school.',
        'Performance time: 12 minutes maximum, including set-up and sound check.',
        'Stage and technical requirements must be submitted at least 2 weeks in advance.',
        'Personal instruments and equipment may be used (MIDI keyboards, guitars, launchpads, etc.).',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'dance-wars',
      name: 'Dance Wars',
      kind: 'stage',
      kindLabel: 'ICE STAGE',
      x: 54, z: -182,
      tagline: 'Two styles minimum. No mercy.',
      description:
        'A high-energy group dance competition celebrating creativity, coordination and stage presence. Teams bring a fully prepared routine that blends at least two distinct dance styles — versatility and performance quality on one stage.',
      date: DATES,
      venue: 'Admin Auditorium',
      rules: [
        'Teams of 4–8 members.',
        'Performances run 2–4 minutes.',
        'Routines must include at least two different dance styles.',
        'Props are required — safe, handheld, and approved in advance.',
        'The routine must be fully pre-choreographed.',
        'Judged on synchronization, transitions between styles, creativity, stage presence and use of props.',
        'Dangerous stunts and inappropriate songs are not permitted.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'masquerade',
      name: 'Masquerade',
      kind: 'pavilion',
      kindLabel: 'DRAMA & THEATRE',
      x: -72, z: -232,
      tagline: 'Three rounds. No fourth wall.',
      description:
        'The basin’s theatre event, played out in three acts: a pre-prepared spoof of a famous story with an assigned twist, a race to write, shoot and edit a short film, and pure on-the-spot improv in front of the audience.',
      date: DATES,
      venue: 'TO BE ANNOUNCED',
      rules: [
        'Teams of 3–6 members · 12 teams.',
        'Round 1 — Spoof It: a 5-minute pre-prepared spoof of a famous story, with an assigned creative twist.',
        'Round 2 — Lights, Camera, Chaos: 90 minutes to write, shoot and edit a 3-minute short film from a surprise genre, object and dialogue line.',
        'Round 3 — Whose Scene Is It Anyway?: live improv from random prompts, props and costumes — closing with time-loop improv.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
    {
      id: 'canvas-to-composition',
      name: 'Canvas to Composition',
      kind: 'installation',
      kindLabel: 'MUSIC COMPOSITION',
      x: 30, z: -262,
      tagline: 'From a blank page to a finished score.',
      description:
        'The basin’s quietest contest — each composer works alone, turning a single prompt (an image, or a written theme) into an original piece of music, from first idea to final composition.',
      date: DATES,
      venue: 'TO BE ANNOUNCED',
      rules: [
        'Individual event.',
        'Choose between two prompts: a visual/image-based prompt, or a written theme.',
        'The original composition must run between 30 seconds and 1 minute.',
        'Instrumental and vocal compositions are both allowed.',
      ],
      registration: SOON,
      registrationOpen: false,
    },
  ],
}

/* ------------------------------------------------------------------ */
/*  OTHER GAMES & EVENTS — RadioShack Activities                      */
/* ------------------------------------------------------------------ */

const RADIOSHACK: Region = {
  id: 'radioshack',
  name: 'OTHER GAMES & EVENTS',
  worldName: 'RadioShack Activities',
  tag: 'REGION 03 — RADIOSHACK ACTIVITIES · 3 900 M',
  intro:
    'Beyond the main arenas lie the RadioShack Activities — a dynamic circuit of individual challenges, trivia, freestyle raps, lip syncs, and dance battles. Test your reflexes, speed, and creative edge.',
  enterLabel: 'ENTER RADIOSHACK ACTIVITIES',
  links: [
    {
      label: 'RadioShack Registration Form',
      url: 'https://forms.cloud.microsoft/r/CPULku1c9D',
    },
  ],
  theme: {
    skyTop: '#040a1b',
    skyHorizon: '#23324a',
    fog: '#142034',
    dirLight: '#ffd699',
    dirIntensity: 0.75,
    ambIntensity: 0.45,
    fogDensity: 0.003,
    snow: 0.35,
    stars: 0.8,
    aurora: 0.4,
    sun: 0,
    accent: '#ffaa3b',
    terrain: 'ridge',
  },
  locations: [
    {
      id: 'wonder-woman-iron-man',
      name: 'The Wonder Woman / Iron Man Challenge',
      kind: 'station',
      kindLabel: 'CHALLENGE STATION',
      x: 25, z: -130,
      tagline: 'Channel your inner hero.',
      description:
        'Channel your inner hero in a test of resilience and strength in this year’s edition of the iconic VIVUM event!',
      date: DATES,
      venue: 'RadioShack Arena',
      rules: [
        'Participation: Individual',
        'Important information: Ensure you are dressed in comfortable attire, including proper footwear.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'pause-and-play',
      name: 'Pause & Play',
      kind: 'stage',
      kindLabel: 'MUSICAL STAGE',
      x: 85, z: -170,
      tagline: 'Complete the song and sing along.',
      description:
        'Complete the song and sing along in this game of musical fill-in the blanks. Test your lyric knowledge under pressure!',
      date: DATES,
      venue: 'RadioShack Pavilion',
      rules: [
        'Participation: Individual',
        'Important information: You get 30 seconds to finish the missing song lyrics on the spot and are only allowed 1 hint. Participants with the greatest number of correct answers are declared the winners.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'trojan-trivia',
      name: 'Trojan Trivia',
      kind: 'pavilion',
      kindLabel: 'TRIVIA ARENA',
      x: 40, z: -220,
      tagline: 'A quest of wits and wisdom.',
      description:
        'Put your knowledge to the trial in this quest of wits and wisdom. Answer questions correctly for a prize at the finish line and prove you’re the ultimate quiz champion!',
      date: DATES,
      venue: 'RadioShack Pavilion',
      rules: [
        'Participation: Teams of 3 – 4 members',
        'Important information: One person from each group of 3 or 4 should sign up.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'defeat-the-dragon-warrior',
      name: 'Defeat the Dragon Warrior',
      kind: 'beacon',
      kindLabel: 'REFLEX CHALLENGE',
      x: -25, z: -270,
      tagline: 'Speed, accuracy and reflexes.',
      description:
        'Inspired by cinema’s most famous snow leopard, this event challenges your speed, accuracy and reflexes in a series of timed mini games. Are you willing to reclaim your title as the true Dragon Warrior, like Tai Lung?',
      date: DATES,
      venue: 'RadioShack Arena',
      rules: [
        'Participation: Individual',
        'Important information: Ensure you are dressed in comfortable attire, including proper footwear.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'lip-sync',
      name: 'Lip Sync',
      kind: 'stage',
      kindLabel: 'PERFORMANCE STAGE',
      x: 45, z: -315,
      tagline: 'Bring popular songs to life.',
      description:
        'Showcase your talents by lip syncing to popular songs! Bring these songs to life in a striking performance (bonus points for a personal choreography).',
      date: DATES,
      venue: 'RadioShack Stage',
      rules: [
        'Participation: Individual / Teams of 2 members',
        'Important information: You can submit a song of your choice or choose one on the spot. Your performance will be judged on creativity and crowd engagement. One person from each team of 2 must sign up.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'rap-battle',
      name: 'Rap Battle',
      kind: 'installation',
      kindLabel: 'FREESTYLE STAGE',
      x: 105, z: -360,
      tagline: 'Freestyle rap to a beat with wildcards.',
      description:
        'Introducing a new twist to this memorable VIVUM event! Create a rap on spot to a beat and be prepared to incorporate new words thrown your way into your performance.',
      date: DATES,
      venue: 'RadioShack Stage',
      rules: [
        'Participation: Individual',
        'Important information: Your performance will be judged on your adaptability, level of freestyle, and crowd engagement.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
    {
      id: 'beat-blitz',
      name: 'Beat Blitz',
      kind: 'camp',
      kindLabel: 'DANCE-OFF ARENA',
      x: 15, z: -400,
      tagline: 'High-impact dance-off battle.',
      description:
        'In this classic dance-off, teams battle it out through high impact rounds, and the one with the strongest performance takes the win. Bring your best moves to the table and show us what you got!',
      date: DATES,
      venue: 'RadioShack Main Arena',
      rules: [
        'Participation: Teams of 5-6 members',
        'Important information: You will be judged on entertainment value, creativity and crowd engagement with 90 seconds per performance. Pre-prepared routines, including props or dangerous stunts, are not allowed. One person from each team should sign up.',
      ],
      registration: 'https://forms.cloud.microsoft/r/CPULku1c9D',
      registrationOpen: true,
    },
  ],
}

export const REGIONS: Record<string, Region> = {
  sports: SPORTS,
  cultural: CULTURAL,
  radioshack: RADIOSHACK,
}

