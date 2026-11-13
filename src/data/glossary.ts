import type { MessageKey } from '../i18n/core.ts'

export interface GlossaryEntry {
  id: string
  /** Heading shown on the Help page. It is the word as it appears in posts, so it is not translated. */
  term: string
  /** Regular-expression sources that find this term in running text (case-insensitive). */
  patterns: string[]
  /** The message that explains it, in every language (see src/i18n). */
  definition: MessageKey
  kind: 'term' | 'abbreviation'
}

/**
 * Jargon and abbreviations that appear in uploads and profiles (WCAG 3.1.3 and 3.1.4).
 * In running text each match becomes a button that reveals the definition in place;
 * the full list is on the Help page.
 */
export const glossary: GlossaryEntry[] = [
  {
    id: 'ambient',
    term: 'Ambient',
    patterns: ['ambient'],
    definition: 'glossary.ambient',
    kind: 'term',
  },
  {
    id: 'bikepacking',
    term: 'Bikepacking',
    patterns: ['bikepacking'],
    definition: 'glossary.bikepacking',
    kind: 'term',
  },
  {
    id: 'celadon',
    term: 'Celadon',
    patterns: ['celadon'],
    definition: 'glossary.celadon',
    kind: 'term',
  },
  {
    id: 'crema',
    term: 'Crema',
    patterns: ['crema'],
    definition: 'glossary.crema',
    kind: 'term',
  },
  {
    id: 'darkroom',
    term: 'Darkroom',
    patterns: ['darkroom'],
    definition: 'glossary.darkroom',
    kind: 'term',
  },
  {
    id: 'field-recording',
    term: 'Field recording',
    patterns: ['field ?recordist', 'field ?recording'],
    definition: 'glossary.fieldRecording',
    kind: 'term',
  },
  {
    id: 'float',
    term: 'Float',
    patterns: ['float'],
    definition: 'glossary.float',
    kind: 'term',
  },
  {
    id: 'glaze',
    term: 'Glaze',
    patterns: ['glazes', 'glaze'],
    definition: 'glossary.glaze',
    kind: 'term',
  },
  {
    id: 'gravel',
    term: 'Gravel riding',
    patterns: ['gravel'],
    definition: 'glossary.gravel',
    kind: 'term',
  },
  {
    id: 'hydrophone',
    term: 'Hydrophone',
    patterns: ['hydrophones?'],
    definition: 'glossary.hydrophone',
    kind: 'term',
  },
  {
    id: 'macro',
    term: 'Macro',
    patterns: ['macro'],
    definition: 'glossary.macro',
    kind: 'term',
  },
  {
    id: 'omnis',
    term: 'Omnis',
    patterns: ['omnis'],
    definition: 'glossary.omnis',
    kind: 'term',
  },
  {
    id: 'portra-400',
    term: 'Portra 400',
    patterns: ['portra ?400'],
    definition: 'glossary.portra400',
    kind: 'term',
  },
  {
    id: 'pushed-one-stop',
    term: 'Pushed one stop',
    patterns: ['pushed one stop'],
    definition: 'glossary.pushedOneStop',
    kind: 'term',
  },
  {
    id: 'ristretto',
    term: 'Ristretto',
    patterns: ['ristretto'],
    definition: 'glossary.ristretto',
    kind: 'term',
  },
  {
    id: 'risograph',
    term: 'Risograph',
    patterns: ['risograph', 'riso'],
    definition: 'glossary.risograph',
    kind: 'term',
  },
  {
    id: 'safelight',
    term: 'Safelight',
    patterns: ['safelight'],
    definition: 'glossary.safelight',
    kind: 'term',
  },
  {
    id: 'thirty-five-mm',
    term: '35mm',
    patterns: ['35 ?mm'],
    definition: 'glossary.thirtyFiveMm',
    kind: 'term',
  },
  {
    id: 'zine',
    term: 'Zine',
    patterns: ['zines?'],
    definition: 'glossary.zine',
    kind: 'term',
  },
  {
    id: 'am',
    term: 'a.m.',
    patterns: ['a\\.m\\.'],
    definition: 'glossary.am',
    kind: 'abbreviation',
  },
  {
    id: 'diy',
    term: 'DIY',
    patterns: ['DIY'],
    definition: 'glossary.diy',
    kind: 'abbreviation',
  },
  {
    id: 'fl',
    term: 'FL',
    patterns: ['FL'],
    definition: 'glossary.fl',
    kind: 'abbreviation',
  },
  {
    id: 'km',
    term: 'km',
    patterns: ['km'],
    definition: 'glossary.km',
    kind: 'abbreviation',
  },
]

export type TextPart = string | { entry: GlossaryEntry; text: string }

// Matches stand alone: "zine" lights up, "zinefest" or the "FL" inside "flat" do not.
const compiled = glossary.map((entry) => ({
  entry,
  // Abbreviations such as "FL" are matched case-sensitively so they do not light up ordinary words.
  regex: new RegExp(
    String.raw`(?<![\p{L}\p{N}])(?:${entry.patterns.join('|')})(?![\p{L}\p{N}])`,
    entry.kind === 'abbreviation' && entry.term === entry.term.toUpperCase() ? 'gu' : 'giu',
  ),
}))

/** Splits text into plain strings and glossary matches. Longer matches win over overlapping shorter ones. */
export function splitGlossary(text: string): TextPart[] {
  const found = compiled
    .flatMap(({ entry, regex }) =>
      [...text.matchAll(regex)].map((m) => ({ entry, text: m[0], start: m.index, end: m.index + m[0].length })),
    )
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const parts: TextPart[] = []
  let last = 0
  for (const hit of found) {
    if (hit.start < last) continue // overlaps one we already used
    if (hit.start > last) parts.push(text.slice(last, hit.start))
    parts.push({ entry: hit.entry, text: hit.text })
    last = hit.end
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
