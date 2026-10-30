const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export const formatDate = (iso: string) => shortDate.format(new Date(iso))
export const formatMonthYear = (iso: string) => longDate.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))

/** "1.2k", "8.9k", "214" */
export function compact(n: number): string {
  if (n < 1000) return String(n)
  // Truncate rather than round, so 8,964 reads "8.9k" and not "9k".
  const thousands = n < 10000 ? Math.floor(n / 100) / 10 : Math.floor(n / 1000)
  return `${thousands}k`
}

/** The mock data is pinned around late Oct 2026, so day labels are relative to that. */
const MOCK_NOW = new Date('2026-10-30T12:00:00')

export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor(
    (new Date(MOCK_NOW.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000,
  )
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return shortDate.format(d)
}

/** Short relative time like "2h" or "3d", pinned to the mock clock. */
export function ago(iso: string): string {
  const mins = Math.max(1, Math.round((MOCK_NOW.getTime() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return `${mins}m`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`
  const days = Math.round(mins / (60 * 24))
  return days < 14 ? `${days}d` : shortDate.format(new Date(iso))
}
