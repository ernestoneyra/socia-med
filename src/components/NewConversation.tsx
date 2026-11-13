import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { useData } from '../data/store.ts'
import { useT } from '../i18n/useT.tsx'
import { paths } from '../lib/router.ts'
import Avatar from './Avatar.tsx'
import Status from './Status.tsx'

/**
 * "New message": find a person and open a conversation with them. Choosing someone who is already
 * in the list simply opens that conversation; someone new gets an empty thread, and the
 * conversation exists once the first message is sent.
 */
export default function NewConversation() {
  const t = useT()
  const { otherUsers } = useData()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const needle = query.trim().toLowerCase()
  const matches = otherUsers
    .filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.handle.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))

  function close(returnFocus: boolean) {
    setOpen(false)
    setQuery('')
    if (returnFocus) buttonRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent) {
    // Escape closes what was opened, and puts the keyboard back where it started (SC 2.1.2).
    if (e.key === 'Escape') {
      e.stopPropagation()
      close(true)
    }
  }

  return (
    <div className="border-b border-line p-3" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close(false) : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2"
      >
        <PencilSquareIcon className="size-4" aria-hidden="true" />
        {t('newMessage.button')}
      </button>

      <div id={panelId} hidden={!open} className="mt-3">
        {open && (
          <>
            <Status>
              {matches.length === 0 ? t('newMessage.none') : t('count.peopleFound', { n: matches.length })}
            </Status>
            <form role="search" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor={`${panelId}-search`} className="sr-only">
                {t('newMessage.search')}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id={`${panelId}-search`}
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('newMessage.search')}
                  autoComplete="off"
                  className="min-h-11 w-full rounded-full border border-edge bg-paper py-2 pl-10 pr-4 text-sm placeholder:text-muted focus-visible:outline-offset-0"
                />
              </div>
            </form>
            {matches.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted">{t('newMessage.noMatch', { query: query.trim() })}</p>
            ) : (
              <ul aria-label={t('newMessage.people')} className="mt-2 max-h-64 overflow-y-auto">
                {matches.map((u) => (
                  <li key={u.id}>
                    <a
                      href={paths.messages(u.id)}
                      onClick={() => close(false)}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2 focus-visible:-outline-offset-2"
                    >
                      <Avatar user={u} size="sm" />
                      <span className="min-w-0 break-words text-sm">
                        <span className="block font-medium">
                          <span className="sr-only">{t('newMessage.messagePrefix')}</span>
                          {u.name}
                        </span>
                        <span className="block text-muted">@{u.handle}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
