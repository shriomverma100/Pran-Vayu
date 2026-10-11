// Fixed reference lists for the Bhopal ghat data. Every list here is checked
// against the CSV at build time, so a change in the source data fails loudly.

export const YEARS = [2023, 2024, 2025] as const
export const FESTIVALS = ['Ganesh', 'Durga'] as const
export const PHASES = ['pre', 'during', 'after'] as const

export type Year = (typeof YEARS)[number]
export type Festival = (typeof FESTIVALS)[number]
export type Phase = (typeof PHASES)[number]

/** One expected test slot per year × festival × phase: 3 × 2 × 3 = 18 per ghat. */
export const SLOTS_PER_GHAT = YEARS.length * FESTIVALS.length * PHASES.length

export const PARAMETERS = [
  'pH',
  'Dissolved oxygen',
  'BOD',
  'COD',
  'Total solids',
  'Dissolved solids',
  'Suspended solids',
  'Turbidity',
  'Conductivity',
  'Chromium',
  'Lead',
  'Zinc',
  'Copper',
] as const
export type Parameter = (typeof PARAMETERS)[number]

export const PARAMETER_CODES: Record<Parameter, string> = {
  pH: 'PH',
  'Dissolved oxygen': 'DO',
  BOD: 'BOD',
  COD: 'COD',
  'Total solids': 'TS',
  'Dissolved solids': 'TDS',
  'Suspended solids': 'TSS',
  Turbidity: 'TURB',
  Conductivity: 'EC',
  Chromium: 'CR',
  Lead: 'PB',
  Zinc: 'ZN',
  Copper: 'CU',
}

export interface GhatInfo {
  id: string
  name: string
  nameHi: string
  waterBody: string
  waterBodyHi: string
  confidence: 'high' | 'medium'
  note?: string
  noteHi?: string
}

/** The 7 ghats in the Bhopal file, with the caveats from the data dictionary. */
export const GHATS: GhatInfo[] = [
  { id: 'BAI', name: 'Bairagarh (Sant Hirdaram) kund', nameHi: 'बैरागढ़ (संत हिरदाराम) कुंड', waterBody: 'Upper Lake', waterBodyHi: 'बड़ा तालाब', confidence: 'high', note: 'No Durga 2025 table in the report', noteHi: 'रिपोर्ट में दुर्गा 2025 की तालिका नहीं है' },
  { id: 'KHA', name: 'Khatlapura ghat', nameHi: 'खटलापुरा घाट', waterBody: 'Lower Lake', waterBodyHi: 'छोटा तालाब', confidence: 'high' },
  { id: 'PRE', name: 'Prempura ghat', nameHi: 'प्रेमपुरा घाट', waterBody: 'Upper Lake', waterBodyHi: 'बड़ा तालाब', confidence: 'high' },
  {
    id: 'RKP',
    name: 'Rani Kamlapati ghat / Kamla Park kund',
    nameHi: 'रानी कमलापति घाट / कमला पार्क कुंड',
    waterBody: 'Lower Lake',
    waterBodyHi: 'छोटा तालाब',
    confidence: 'medium',
    note: 'Ganesh tables say "Kamla Park kund", Durga tables say "Lower Lake ghat". May be two places',
    noteHi: 'गणेश तालिकाओं में "कमला पार्क कुंड" और दुर्गा तालिकाओं में "लोअर लेक घाट" लिखा है। ये दो अलग स्थान हो सकते हैं',
  },
  { id: 'HAT', name: 'Hathaikheda dam / kund', nameHi: 'हथाईखेड़ा डैम / कुंड', waterBody: 'Hathaikheda dam', waterBodyHi: 'हथाईखेड़ा डैम', confidence: 'high' },
  { id: 'MAL', name: 'Malikhedi kund', nameHi: 'मालीखेड़ी कुंड', waterBody: 'Kund', waterBodyHi: 'कुंड', confidence: 'high', note: 'No Durga 2025 table in the report', noteHi: 'रिपोर्ट में दुर्गा 2025 की तालिका नहीं है' },
  { id: 'SHA', name: 'Shahpura lake ghat', nameHi: 'शाहपुरा झील घाट', waterBody: 'Shahpura Lake', waterBodyHi: 'शाहपुरा झील', confidence: 'high' },
]

export const GHAT_BY_NAME = new Map(GHATS.map((g) => [g.name, g]))

/** Report file for each year, served from public/reports/. */
export const REPORTS: Record<Year, { file: string; title: string; url: string }> = {
  2023: {
    file: 'reports/mppcb-visarjan-2023.pdf',
    title: 'MPPCB Idol Immersion Report 2023 (CPCB format)',
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf',
  },
  2024: {
    file: 'reports/mppcb-visarjan-2024.pdf',
    title: 'MPPCB Ganesh and Durga Visarjan Report 2024',
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf',
  },
  2025: {
    file: 'reports/mppcb-visarjan-2025.pdf',
    title: 'MPPCB Ganesh and Durga Visarjan Report 2025',
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf',
  },
}

/** Durga visarjan 2026 (Drik Panchang). */
export const VISARJAN_DATE = '2026-10-20'
