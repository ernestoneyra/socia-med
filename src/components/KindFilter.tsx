import { CheckIcon } from '@heroicons/react/20/solid'
import type { UploadKind } from '../data/types.ts'

export type KindFilterValue = UploadKind | 'all'

const filters: { value: KindFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
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
  return (
    <div role="group" aria-label="Filter by type" className="mb-6 flex flex-wrap gap-2">
      {filters.map((f) => {
        const pressed = value === f.value
        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(f.value)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-5 text-sm font-medium ${
              pressed
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-edge bg-surface text-muted hover:text-ink'
            }`}
          >
            {/* A tick as well as a colour change, so the selection is not conveyed by colour alone (SC 1.4.1). */}
            {pressed && <CheckIcon className="size-4" aria-hidden="true" />}
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
