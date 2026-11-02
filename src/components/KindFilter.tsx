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
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          aria-pressed={value === f.value}
          onClick={() => onChange(f.value)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            value === f.value
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
