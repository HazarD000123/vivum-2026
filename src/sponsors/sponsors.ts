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
  name?: string
  logo?: string
  url?: string
}

export interface SponsorTier {
  id: string
  title: string
  note: string
  /** Placeholder slots shown until real sponsors fill them. */
  slots: Sponsor[]
}

export const TIERS: SponsorTier[] = [
  {
    id: 'title',
    title: 'TITLE PATRON',
    note: 'The name that carries the expedition.',
    slots: [{}],
  },
  {
    id: 'partners',
    title: 'EXPEDITION PARTNERS',
    note: 'The lights along the route.',
    slots: [{}, {}, {}, {}, {}, {}],
  },
]
