import { translate, type Locale } from '../i18n/core.ts'
import { getLocale } from '../i18n/locale.ts'

// These read the current language when called. A component that shows their result also calls
// useT(), which re-renders it when the language changes.
//
// Visible text avoids abbreviations ("Oct", "2h", "1.2k") so that nothing needs expanding (WCAG 3.1.4).

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat | Intl.RelativeTimeFormat>()

function formatter<T extends Intl.DateTimeFormat | Intl.NumberFormat | Intl.RelativeTimeFormat>(
  name: string,
  locale: Locale,
  make: () => T,
): T {
  const key = `${name}:${locale}`
  let f = cache.get(key)
  if (!f) cache.set(key, (f = make()))
  return f as T
}

const shortDateFormat = (locale: Locale) =>
  formatter('short', locale, () => new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }))
const longDateFormat = (locale: Locale) =>
  formatter('long', locale, () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }))
// 24-hour clock: no "AM"/"PM" abbreviation to expand, and no ambiguity between them.
const timeFormat = (locale: Locale) =>
  formatter('time', locale, () => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }))
const countFormat = (locale: Locale) => formatter('count', locale, () => new Intl.NumberFormat(locale))
const relativeFormat = (locale: Locale) =>
  formatter('relative', locale, () => new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'long' }))

export const formatDate = (iso: string) => shortDateFormat(getLocale()).format(new Date(iso))
export const formatMonthYear = (iso: string) => longDateFormat(getLocale()).format(new Date(iso))
export const formatTime = (iso: string) => timeFormat(getLocale()).format(new Date(iso))

/** "1,204", "8,964", "214": the full number, never "1.2k". */
export const count = (n: number): string => countFormat(getLocale()).format(n)

export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  const locale = getLocale()
  if (days <= 0) return translate(locale, 'time.today')
  if (days === 1) return translate(locale, 'time.yesterday')
  return shortDateFormat(locale).format(d)
}

/** Relative time in words, like "2 hours ago" or "3 days ago". */
export function ago(iso: string, now: Date = new Date()): string {
  const locale = getLocale()
  const relative = relativeFormat(locale)
  const mins = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return relative.format(-mins, 'minute')
  if (mins < 60 * 24) return relative.format(-Math.round(mins / 60), 'hour')
  const days = Math.round(mins / (60 * 24))
  return days < 14 ? relative.format(-days, 'day') : shortDateFormat(locale).format(new Date(iso))
}

/** "12:48" -> "12 minutes 48 seconds", "1:02:03" -> "1 hour 2 minutes 3 seconds". */
export function spokenDuration(clock: string): string {
  const locale = getLocale()
  const unit = (n: number, name: 'hour' | 'minute' | 'second') =>
    formatter(`unit-${name}`, locale, () => new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'long' })).format(n)
  const parts = clock.split(':').map(Number)
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts]
  return [h ? unit(h, 'hour') : '', m ? unit(m, 'minute') : '', s ? unit(s, 'second') : ''].filter(Boolean).join(' ')
}

/** "12:48" -> "PT12M48S", for the datetime attribute of <time>. */
export function isoDuration(clock: string): string {
  const parts = clock.split(':').map(Number)
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts]
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`
}
