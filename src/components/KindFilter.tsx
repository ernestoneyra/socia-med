import { CheckIcon } from '@heroicons/react/20/solid'
import type { UploadKind } from '../data/types.ts'

/** The selected types. An empty list means "All". */
export type KindFilterValue = UploadKind[]

export const filterByKinds = <T extends { kind: UploadKind }>(items: T[], kinds: KindFilterValue): T[] =>
  kinds.length ? items.filter((i) => kinds.includes(i.kind)) : items

const filters: { value: UploadKind; label: string }[] = [
  { value: 'photo', label: 'Photos' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'writing', label: 'Writing' },
]

export default function KindFilter({
  value,
  onChange,
}: {
  value: KindFilterValue
  onChange: (value: KindFilterValue) => void
}) {
  const toggle = (kind: UploadKind) =>
    // Deselecting the last type falls back to "All" rather than showing nothing.
    onChange(value.includes(kind) ? value.filter((k) => k !== kind) : [...value, kind])

  const buttons = [
    { key: 'all', label: 'All', pressed: value.length === 0, onClick: () => onChange([]) },
    ...filters.map((f) => ({
      key: f.value,
      label: f.label,
      pressed: value.includes(f.value),
      onClick: () => toggle(f.value),
    })),
  ]

  return (
    <div role="group" aria-label="Filter by type" className="mb-6 flex flex-wrap gap-2">
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
