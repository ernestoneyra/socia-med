import { useId } from 'react'

import type { SortValue } from '../lib/sort.ts'

const options: { value: SortValue; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'last10days', label: 'Last 10 days' },
]

export default function SortFilter({
  value,
  onChange,
}: {
  value: SortValue
  onChange: (value: SortValue) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Show
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="min-h-11 rounded-xl border border-edge bg-paper px-2 py-1 text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
