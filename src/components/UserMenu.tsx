import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { me } from '../data/users.ts'
import { compact } from '../lib/format.ts'
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

  const linkClass =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2'

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full p-0.5 ring-2 transition-shadow ${open ? 'ring-accent' : 'ring-transparent hover:ring-line'}`}
      >
        <Avatar user={me} size="md" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-line bg-surface p-2 shadow-card"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar user={me} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{me.name}</p>
              <p className="truncate text-sm text-muted">@{me.handle}</p>
            </div>
          </div>
          <p className="px-3 pb-2 text-xs text-muted">
            <span className="font-semibold text-ink">{compact(me.followers)}</span> followers ·{' '}
            <span className="font-semibold text-ink">{compact(me.following)}</span> following
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
