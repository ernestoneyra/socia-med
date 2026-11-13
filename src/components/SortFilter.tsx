import { useId } from 'react'

import type { MessageKey } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import type { SortValue } from '../lib/sort.ts'

const options: { value: SortValue; label: MessageKey }[] = [
  { value: 'latest', label: 'sort.latest' },
  { value: 'oldest', label: 'sort.oldest' },
  { value: 'last10days', label: 'sort.last10days' },
]

export default function SortFilter({
  value,
  onChange,
}: {
  value: SortValue
  onChange: (value: SortValue) => void
}) {
  const t = useT()
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {t('sort.show')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="min-h-11 rounded-xl border border-edge bg-paper px-2 py-1 text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.label)}
          </option>
        ))}
      </select>
    </div>
  )
}
