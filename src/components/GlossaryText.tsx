import { useId, useMemo, useState } from 'react'
import { splitGlossary, type GlossaryEntry } from '../data/glossary.ts'
import { useT } from '../i18n/useT.tsx'

/** One term. A real button, so it works with keyboard, touch and screen readers (unlike a title tooltip). */
function Term({ entry, children }: { entry: GlossaryEntry; children: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help rounded-sm underline decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
        <span className="sr-only">{t('glossary.showDefinition')}</span>
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="my-1 block rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink"
        >
          <span className="font-semibold">{entry.term}:</span> {t(entry.definition)}
        </span>
      )}
    </>
  )
}

/**
 * Renders text and turns jargon and abbreviations into expandable definitions
 * (WCAG 3.1.3 Unusual Words, 3.1.4 Abbreviations). The full list lives on the Help page.
 */
export default function GlossaryText({ text }: { text: string }) {
  const parts = useMemo(() => splitGlossary(text), [text])
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <Term key={i} entry={part.entry}>
            {part.text}
          </Term>
        ),
      )}
    </>
  )
}
