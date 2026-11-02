// Visible text avoids abbreviations ("Oct", "2h", "1.2k") so that nothing needs expanding (WCAG 3.1.4).
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
// 24-hour clock: no "AM"/"PM" abbreviation to expand, and no ambiguity between them.
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export const formatDate = (iso: string) => shortDate.format(new Date(iso))
export const formatMonthYear = (iso: string) => longDate.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))

/** "1,204", "8,964", "214": the full number, never "1.2k". */
export const count = (n: number): string => n.toLocaleString('en-US')

/** "1 upload", "2 uploads" */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`): string =>
  `${count(n)} ${n === 1 ? singular : pluralForm}`

export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return shortDate.format(d)
}

/** Relative time in words, like "2 hours ago" or "3 days ago". */
export function ago(iso: string, now: Date = new Date()): string {
  const mins = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return `${plural(mins, 'minute')} ago`
  if (mins < 60 * 24) return `${plural(Math.round(mins / 60), 'hour')} ago`
  const days = Math.round(mins / (60 * 24))
  return days < 14 ? `${plural(days, 'day')} ago` : shortDate.format(new Date(iso))
}

/** "12:48" -> "12 minutes 48 seconds", "1:02:03" -> "1 hour 2 minutes 3 seconds". */
export function spokenDuration(clock: string): string {
  const parts = clock.split(':').map(Number)
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts]
  return [
    h ? plural(h, 'hour') : '',
    m ? plural(m, 'minute') : '',
    s ? plural(s, 'second') : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/** "12:48" -> "PT12M48S", for the datetime attribute of <time>. */
export function isoDuration(clock: string): string {
  const parts = clock.split(':').map(Number)
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts]
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`
}
