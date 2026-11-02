import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import { ArrowUpTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { me } from '../data/users.ts'
import { count } from '../lib/format.ts'
import { paths } from '../lib/router.ts'
import Avatar from './Avatar.tsx'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
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
    if (next instanceof Node && !e.currentTarget.contains(next)) setOpen(false)
  }

  const linkClass = 'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2'

  return (
    <div ref={rootRef} onBlur={onBlur} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
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
            <span className="font-semibold text-ink">{count(me.followers)}</span> followers ·{' '}
            <span className="font-semibold text-ink">{count(me.following)}</span> following
          </p>
          <div className="border-t border-line pt-2">
            <a href={paths.profile(me.id)} onClick={() => setOpen(false)} className={linkClass}>
              <UserCircleIcon className="size-5 text-muted" aria-hidden="true" />
              Your profile
            </a>
            <a href={paths.uploads(me.id)} onClick={() => setOpen(false)} className={linkClass}>
              <ArrowUpTrayIcon className="size-5 text-muted" aria-hidden="true" />
              Your uploads
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
