import { CheckIcon } from '@heroicons/react/20/solid'
import type { UploadKind } from '../data/types.ts'
import type { MessageKey } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'

/** The selected types. An empty list means "All". */
export type KindFilterValue = UploadKind[]

const filters: { value: UploadKind; label: MessageKey }[] = [
  { value: 'photo', label: 'filter.photos' },
  { value: 'audio', label: 'filter.audio' },
  { value: 'video', label: 'filter.video' },
  { value: 'writing', label: 'filter.writing' },
]

export default function KindFilter({
  value,
  onChange,
  className = 'mb-6',
}: {
  value: KindFilterValue
  onChange: (value: KindFilterValue) => void
  /** Spacing around the group; defaults to a bottom margin. */
  className?: string
}) {
  const t = useT()
  const toggle = (kind: UploadKind) =>
    // Deselecting the last type falls back to "All" rather than showing nothing.
    onChange(value.includes(kind) ? value.filter((k) => k !== kind) : [...value, kind])

  const buttons = [
    { key: 'all', label: t('filter.all'), pressed: value.length === 0, onClick: () => onChange([]) },
    ...filters.map((f) => ({
      key: f.value,
      label: t(f.label),
      pressed: value.includes(f.value),
      onClick: () => toggle(f.value),
    })),
  ]

  return (
    <div role="group" aria-label={t('filter.group')} className={`flex flex-wrap gap-2 ${className}`}>
      {buttons.map(({ key, label, pressed, onClick }) => (
        <button
          key={key}
          type="button"
          aria-pressed={pressed}
          onClick={onClick}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-5 text-sm font-medium ${
            pressed
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-edge bg-surface text-muted hover:text-ink'
          }`}
        >
          {/* A tick as well as a colour change, so the selection is not conveyed by colour alone (SC 1.4.1). */}
          {pressed && <CheckIcon className="size-4" aria-hidden="true" />}
          {label}
        </button>
      ))}
    </div>
  )
}
