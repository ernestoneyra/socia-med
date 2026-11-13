import { useSyncExternalStore } from 'react'
import { DEFAULT_LOCALE, LOCALES, isLocale, matchLocale, type Locale } from './core.ts'

const STORAGE_KEY = 'locale'

/** The saved choice, else the first browser language we have text for, else English. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Storage can be blocked (private mode); the language still applies for this session.
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const found = tag ? matchLocale(tag) : undefined
    if (found) return found
  }
  return DEFAULT_LOCALE
}

let current: Locale = initialLocale()
const listeners = new Set<() => void>()

/** Screen readers pick their voice from this, and browsers choose CJK fonts and hyphenation by it. */
function applyToDocument(locale: Locale) {
  document.documentElement.lang = LOCALES.find((l) => l.code === locale)?.lang ?? locale
}
applyToDocument(current)

export const getLocale = (): Locale => current

export function setLocale(next: Locale) {
  if (next === current) return
  current = next
  applyToDocument(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // See above.
  }
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

/** Re-renders the component when the language changes. */
export const useLocale = (): Locale => useSyncExternalStore(subscribe, getLocale)
