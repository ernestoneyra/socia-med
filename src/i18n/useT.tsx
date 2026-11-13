import { Fragment, useMemo, type ReactNode } from 'react'
import { fill, template, translate, translateMsg, type Locale, type MessageKey, type Msg, type Params } from './core.ts'
import { useLocale } from './locale.ts'

/** Turns `<tag>text</tag>` spans of a message into elements. Params fill the text only, never the tags. */
export type Tags = Record<string, (text: string) => ReactNode>

export function rich(locale: Locale, key: MessageKey, params: Params | undefined, tags: Tags): ReactNode {
  const source = template(locale, key, params)
  const pieces: ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of source.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) {
    const [whole, name, inner] = match
    if (match.index > last) pieces.push(fill(locale, source.slice(last, match.index), params))
    const render = tags[name]
    const text = fill(locale, inner, params)
    pieces.push(<Fragment key={index++}>{render ? render(text) : text}</Fragment>)
    last = match.index + whole.length
  }
  if (last < source.length) pieces.push(fill(locale, source.slice(last), params))
  return pieces.map((piece, i) => (typeof piece === 'string' ? <Fragment key={`t${i}`}>{piece}</Fragment> : piece))
}

export interface T {
  (key: MessageKey, params?: Params): string
  /** A message that was prepared earlier (such as a validation error), or text the server wrote. */
  msg: (message: Msg | string | undefined) => string
  /** A message with `<tag>…</tag>` spans that become elements. */
  rich: (key: MessageKey, params: Params | undefined, tags: Tags) => ReactNode
  locale: Locale
}

/**
 * The translate function for the current language. Calling it subscribes the component to
 * language changes, so every piece of text (and every date and number) updates at once.
 */
export function useT(): T {
  const locale = useLocale()
  return useMemo(
    (): T =>
      Object.assign((key: MessageKey, params?: Params) => translate(locale, key, params), {
        msg: (message: Msg | string | undefined) => translateMsg(locale, message),
        rich: (key: MessageKey, params: Params | undefined, tags: Tags) => rich(locale, key, params, tags),
        locale,
      }),
    [locale],
  )
}
