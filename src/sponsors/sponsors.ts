// ---------------------------------------------------------------------------
// The expedition's patrons. Placeholder slots until the committee sends the
// logos.
//
// To add a real sponsor:
//   1. Drop the logo file into `public/sponsors/` (e.g. public/sponsors/acme.png)
//   2. Fill in the slot below: { name: 'Acme Corp', logo: '/sponsors/acme.png',
//      url: 'https://acme.example' } — `url` is optional.
// Slots without a name render as "REVEALING SOON" placeholders.
// ---------------------------------------------------------------------------

export interface Sponsor {
  name: string
  logo: string
  url?: string
}

export interface SponsorTier {
  id: string
  title: string
  note: string
  slots: Sponsor[]
}

export const TIERS: SponsorTier[] = [
  {
    id: 'tier-1',
    title: 'PLATINUM SPONSORS',
    note: 'The foundational backers carrying the summit expedition.',
    slots: [
      { name: 'Black Poetry', logo: '/sponsors/black-poetry.png' },
      { name: 'Drizzl', logo: '/sponsors/drizzl.png' },
      { name: 'Dhruv Sehgal', logo: '/sponsors/dhruv-sehgal.png' },
      { name: 'Sukhjit Starch & Chemicals', logo: '/sponsors/sukhjit.png' },
      { name: 'Nivia', logo: '/sponsors/nivia.png' },
    ],
  },
  {
    id: 'tier-2',
    title: 'GOLD SPONSORS',
    note: 'The guiding lights lighting the trail across the ridges.',
    slots: [
      { name: 'UNext', logo: '/sponsors/unext.png' },
      { name: 'Poker', logo: '/sponsors/pokerbaazi.png' },
    ],
  },
  {
    id: 'tier-3',
    title: 'SILVER SPONSORS',
    note: 'The essential supporters fueling every stage of the journey.',
    slots: [
      { name: 'Camlin', logo: '/sponsors/camlin.png' },
      { name: 'Niva Bupa', logo: '/sponsors/niva-bupa.png' },
      { name: 'Ohana Fine Flowers', logo: '/sponsors/ohana.png' },
      { name: 'Rescript', logo: '/sponsors/rescript.png' },
      { name: 'Aashwi', logo: '/sponsors/aashwi.png' },
    ],
  },
]

