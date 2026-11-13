/**
 * Translation core. No DOM and no React in here: the server imports it too, to write the
 * English text of validation errors, and the browser wraps it in `useT` (see useT.tsx).
 */
import { en } from './en.ts'
import { ja } from './ja.ts'
import { sv } from './sv.ts'
import { zhTW } from './zh-TW.ts'

export type Locale = 'en' | 'sv' | 'ja' | 'zh-TW'
export type MessageKey = keyof typeof en

/** Plural forms of one message, picked with the language's own rules (Intl.PluralRules) from `{n}`. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
export type Message = string | PluralForms
/** Every language has to supply every message the English dictionary has, or the build fails. */
export type Dictionary = Record<MessageKey, Message>

/** A message that has not been turned into text yet, so it can follow the language when that changes. */
export interface Msg {
  key: MessageKey
  params?: Params
}
/** A param can itself be a message ("{kind}" in "Choose a {kind} file"), so word order stays the language's own. */
export type Params = Record<string, string | number | Msg>

export const m = (key: MessageKey, params?: Params): Msg => (params ? { key, params } : { key })

export interface LocaleInfo {
  code: Locale
  /** The language's name in that language, so it can be found whatever the page currently says. */
  name: string
  /** The BCP 47 tag for the `lang` attribute. */
  lang: string
}

export const LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', lang: 'en' },
  { code: 'sv', name: 'Svenska', lang: 'sv' },
  { code: 'ja', name: '日本語', lang: 'ja' },
  { code: 'zh-TW', name: '繁體中文（台灣）', lang: 'zh-TW' },
]

export const DEFAULT_LOCALE: Locale = 'en'

const dictionaries: Record<Locale, Dictionary> = { en, sv, ja, 'zh-TW': zhTW }

export const isLocale = (value: unknown): value is Locale => LOCALES.some((l) => l.code === value)

/** Picks the closest supported language for a browser language tag such as "sv-SE" or "zh-Hant-TW". */
export function matchLocale(tag: string): Locale | undefined {
  const lower = tag.toLowerCase()
  if (lower.startsWith('sv')) return 'sv'
  if (lower.startsWith('ja')) return 'ja'
  // The Chinese text here is Traditional, written for Taiwan. Simplified-script variants are not covered.
  if (lower.startsWith('zh') && !/hans|cn|sg/.test(lower)) return 'zh-TW'
  if (lower.startsWith('en')) return 'en'
  return undefined
}

const numberFormats = new Map<Locale, Intl.NumberFormat>()
const pluralRules = new Map<Locale, Intl.PluralRules>()

function formatNumber(locale: Locale, n: number): string {
  let f = numberFormats.get(locale)
  if (!f) numberFormats.set(locale, (f = new Intl.NumberFormat(locale)))
  return f.format(n)
}

function pluralCategory(locale: Locale, n: number): Intl.LDMLPluralRule {
  let r = pluralRules.get(locale)
  if (!r) pluralRules.set(locale, (r = new Intl.PluralRules(locale)))
  return r.select(n)
}

function isMsg(value: unknown): value is Msg {
  return typeof value === 'object' && value !== null && 'key' in value
}

/** The template for a key in a language, with the plural form chosen. Falls back to English. */
export function template(locale: Locale, key: MessageKey, params?: Params): string {
  const entry = dictionaries[locale][key] ?? en[key]
  if (typeof entry === 'string') return entry
  const n = params?.n
  const category = typeof n === 'number' ? pluralCategory(locale, n) : 'other'
  return entry[category] ?? entry.other
}

/** Substitutes `{name}` in a template. Numbers are written the way the language writes them. */
export function fill(locale: Locale, text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name]
    if (value === undefined) return whole
    if (typeof value === 'number') return formatNumber(locale, value)
    if (typeof value === 'string') return value
    return translate(locale, value.key, value.params)
  })
}

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  return fill(locale, template(locale, key, params), params)
}

/** Turns a message, or text that was already written (for example by the server), into a string. */
export function translateMsg(locale: Locale, message: Msg | string | undefined): string {
  if (message === undefined) return ''
  return isMsg(message) ? translate(locale, message.key, message.params) : message
}
