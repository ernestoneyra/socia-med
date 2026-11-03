export interface GlossaryEntry {
  id: string
  /** Heading shown on the Help page. */
  term: string
  /** Regular-expression sources that find this term in running text (case-insensitive). */
  patterns: string[]
  definition: string
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
    definition: 'Quiet, atmospheric music or sound that sets a mood instead of demanding attention.',
    kind: 'term',
  },
  {
    id: 'bikepacking',
    term: 'Bikepacking',
    patterns: ['bikepacking'],
    definition: 'Travelling by bicycle with camping gear packed onto the frame instead of in panniers.',
    kind: 'term',
  },
  {
    id: 'celadon',
    term: 'Celadon',
    patterns: ['celadon'],
    definition: 'A pale grey-green glaze used on pottery.',
    kind: 'term',
  },
  {
    id: 'crema',
    term: 'Crema',
    patterns: ['crema'],
    definition: 'The light brown foam on top of a freshly made espresso.',
    kind: 'term',
  },
  {
    id: 'darkroom',
    term: 'Darkroom',
    patterns: ['darkroom'],
    definition: 'A room with controlled light where photographs are developed and printed.',
    kind: 'term',
  },
  {
    id: 'field-recording',
    term: 'Field recording',
    patterns: ['field ?recordist', 'field ?recording'],
    definition: 'Recording sound outside a studio, in real places such as markets, harbours or forests.',
    kind: 'term',
  },
  {
    id: 'float',
    term: 'Float',
    patterns: ['float'],
    definition: 'Cash in small notes and coins that a seller keeps ready to give change.',
    kind: 'term',
  },
  {
    id: 'glaze',
    term: 'Glaze',
    patterns: ['glazes', 'glaze'],
    definition: 'A glassy coating that is fired onto pottery to colour it and make it waterproof.',
    kind: 'term',
  },
  {
    id: 'gravel',
    term: 'Gravel riding',
    patterns: ['gravel'],
    definition: 'Cycling on unpaved roads and tracks made of loose stone, dirt or sand.',
    kind: 'term',
  },
  {
    id: 'hydrophone',
    term: 'Hydrophone',
    patterns: ['hydrophones?'],
    definition: 'A microphone that records sound underwater.',
    kind: 'term',
  },
  {
    id: 'macro',
    term: 'Macro',
    patterns: ['macro'],
    definition: 'Close-up photography of very small subjects, shown larger than life.',
    kind: 'term',
  },
  {
    id: 'omnis',
    term: 'Omnis',
    patterns: ['omnis'],
    definition: 'Short for omnidirectional microphones, which pick up sound equally from every direction.',
    kind: 'term',
  },
  {
    id: 'portra-400',
    term: 'Portra 400',
    patterns: ['portra ?400'],
    definition: 'A colour film made by Kodak, popular for its soft, natural skin tones. The 400 is its light sensitivity.',
    kind: 'term',
  },
  {
    id: 'pushed-one-stop',
    term: 'Pushed one stop',
    patterns: ['pushed one stop'],
    definition:
      'Shooting film as if it were more sensitive to light than it is, then developing it for longer to make up the difference. One stop means twice the sensitivity.',
    kind: 'term',
  },
  {
    id: 'ristretto',
    term: 'Ristretto',
    patterns: ['ristretto'],
    definition: 'A short, concentrated shot of espresso.',
    kind: 'term',
  },
  {
    id: 'risograph',
    term: 'Risograph',
    patterns: ['risograph', 'riso'],
    definition:
      'A fast, low-cost printing machine that prints one ink colour at a time. The layered result looks bright and slightly grainy.',
    kind: 'term',
  },
  {
    id: 'safelight',
    term: 'Safelight',
    patterns: ['safelight'],
    definition: 'A dim coloured lamp that lets you work with photographic paper without spoiling it.',
    kind: 'term',
  },
  {
    id: 'thirty-five-mm',
    term: '35mm',
    patterns: ['35 ?mm'],
    definition: 'The most common size of photographic film. It is 35 millimetres wide.',
    kind: 'term',
  },
  {
    id: 'zine',
    term: 'Zine',
    patterns: ['zines?'],
    definition: 'A small, self-published booklet, often made by hand or photocopied.',
    kind: 'term',
  },
  {
    id: 'am',
    term: 'a.m.',
    patterns: ['a\\.m\\.'],
    definition: 'Before noon. Latin: ante meridiem.',
    kind: 'abbreviation',
  },
  {
    id: 'diy',
    term: 'DIY',
    patterns: ['DIY'],
    definition: 'Do it yourself.',
    kind: 'abbreviation',
  },
  {
    id: 'fl',
    term: 'FL',
    patterns: ['FL'],
    definition: 'Florida, a state in the United States.',
    kind: 'abbreviation',
  },
  {
    id: 'km',
    term: 'km',
    patterns: ['km'],
    definition: 'Kilometres. One kilometre is about 0.62 miles.',
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
