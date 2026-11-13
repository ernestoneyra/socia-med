import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  LanguageIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import { signOut, useData } from '../data/store.ts'
import { LOCALES, translate, type Locale } from '../i18n/core.ts'
import { setLocale } from '../i18n/locale.ts'
import { useT } from '../i18n/useT.tsx'
import { announce } from '../lib/announce.ts'
import { count } from '../lib/format.ts'
import { paths } from '../lib/router.ts'
import Avatar from './Avatar.tsx'

export default function UserMenu() {
  const t = useT()
  const { me } = useData()
  const [open, setOpen] = useState(false)
  const [choosingLanguage, setChoosingLanguage] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutFailed, setSignOutFailed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const languagesId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Tabbing out of the menu closes it, so it never lingers over the page after focus has moved on.
  // relatedTarget is null when focus leaves the window or lands on nothing; we leave the menu open then.
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget
    if (next instanceof Node && !e.currentTarget.contains(next)) closeMenu()
  }

  // The menu closes with the language list folded, so it opens the same way every time.
  function closeMenu() {
    setOpen(false)
    setChoosingLanguage(false)
  }

  function chooseLanguage(next: Locale) {
    const info = LOCALES.find((l) => l.code === next)
    setLocale(next)
    closeMenu()
    buttonRef.current?.focus()
    // Said in the new language: that is the one the person has just asked for.
    if (info) announce(translate(next, 'menu.languageChanged', { language: info.name }))
  }

  async function onSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setSignOutFailed(false)
    try {
      // On success the whole app is replaced by the sign-in page, taking this menu with it.
      await signOut()
    } catch (err) {
      console.error('Could not sign out.', err)
      setSigningOut(false)
      setSignOutFailed(true)
    }
  }

  const linkClass = 'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2'

  return (
    <div ref={rootRef} onBlur={onBlur} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('menu.account')}
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className={`rounded-full p-0.5 ring-2 transition-shadow ${open ? 'ring-accent' : 'ring-transparent hover:ring-edge'}`}
      >
        <Avatar user={me} size="md" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-2 shadow-card"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar user={me} size="lg" />
            <div className="flex h-14 min-w-0 flex-col justify-center">
              <p className="truncate text-xl font-medium leading-6">{me.name}</p>
              <p className="">@{me.handle}</p>
            </div>
          </div>
          <p className="px-3 pb-2 text-sm text-muted">
            <span className="font-semibold text-ink">{count(me.followers)}</span> {t('menu.followers')} ·{' '}
            <span className="font-semibold text-ink">{count(me.following)}</span> {t('menu.following')}
          </p>
          <div className="border-t border-line pt-2">
            <a href={paths.profile(me.id)} onClick={closeMenu} className={linkClass}>
              <UserCircleIcon className="size-5 text-muted" aria-hidden="true" />
              {t('menu.profile')}
            </a>
            <a href={paths.uploads(me.id)} onClick={closeMenu} className={linkClass}>
              <ArrowUpTrayIcon className="size-5 text-muted" aria-hidden="true" />
              {t('menu.uploads')}
            </a>
            <button
              type="button"
              aria-expanded={choosingLanguage}
              aria-controls={choosingLanguage ? languagesId : undefined}
              onClick={() => setChoosingLanguage((v) => !v)}
              className={`${linkClass} w-full text-left`}
            >
              <LanguageIcon className="size-5 text-muted" aria-hidden="true" />
              <span className="flex-1">{t('menu.language')}</span>
              <span className="text-muted">{LOCALES.find((l) => l.code === t.locale)?.name}</span>
              <ChevronDownIcon
                className={`size-4 text-muted transition-transform motion-reduce:transition-none ${choosingLanguage ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {choosingLanguage && (
              <ul id={languagesId} aria-label={t('menu.language')} className="mb-1 ml-8 border-l border-line pl-2">
                {LOCALES.map(({ code, name, lang }) => {
                  const current = code === t.locale
                  return (
                    <li key={code}>
                      {/* Each name is in its own language, so it is marked as such for screen readers. */}
                      <button
                        type="button"
                        lang={lang}
                        aria-pressed={current}
                        onClick={() => chooseLanguage(code)}
                        className={`${linkClass} w-full text-left ${current ? 'font-semibold' : ''}`}
                      >
                        <span className="flex-1">{name}</span>
                        {/* A tick as well as the bold, so the choice is not conveyed by weight alone (SC 1.4.1). */}
                        {current && <CheckIcon className="size-4 text-accent" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="mt-2 border-t border-line pt-2">
            {signOutFailed && (
              <p role="alert" className="px-3 pb-2 text-sm font-medium">
                {t('menu.signOutFailed')}
              </p>
            )}
            <button
              type="button"
              onClick={() => void onSignOut()}
              aria-disabled={signingOut}
              className={`${linkClass} w-full text-left aria-disabled:cursor-wait aria-disabled:opacity-70`}
            >
              <ArrowRightStartOnRectangleIcon className="size-5 text-muted" aria-hidden="true" />
              {signingOut ? t('menu.signingOut') : t('menu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
