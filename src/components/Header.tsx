import type { ComponentType, SVGProps } from 'react'
import {
  ArrowUpTrayIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import {
  ArrowUpTrayIcon as ArrowUpTraySolid,
  BellIcon as BellSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
} from '@heroicons/react/24/solid'
import { useData } from '../data/store.ts'
import { unreadMessageCount,unreadNotificationCount, useInbox } from '../data/inbox.ts'
import { paths, useRoute, type Route } from '../lib/router.ts'
import ThemeToggle from './ThemeToggle.tsx'
import UserMenu from './UserMenu.tsx'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

interface NavEntry {
  route: Route['name']
  label: string
  href: string
  Icon: Icon
  ActiveIcon: Icon
}

const nav: NavEntry[] = [
  { route: 'home', label: 'Home', href: paths.home, Icon: HomeIcon, ActiveIcon: HomeSolid },
  { route: 'explore', label: 'Explore', href: paths.explore, Icon: MagnifyingGlassIcon, ActiveIcon: MagnifyingGlassSolid },
  { route: 'messages', label: 'Messages', href: paths.messages(), Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid },
  { route: 'notifications', label: 'Notifications', href: paths.notifications, Icon: BellIcon, ActiveIcon: BellSolid },
  // href is filled in by the Header: this tab shows the signed-in user's uploads only.
  { route: 'uploads', label: 'Uploads', href: paths.uploads(), Icon: ArrowUpTrayIcon, ActiveIcon: ArrowUpTraySolid },
]

function Logo() {
  return (
    <a href={paths.home} className="flex min-h-11 items-center gap-2.5" aria-label="socia-med home">
      <svg viewBox="0 0 32 32" className="size-8 text-accent" aria-hidden="true">
        <circle cx="12" cy="16" r="9" fill="currentColor" />
        <circle cx="21" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">
        socia<span className="text-accent">-med</span>
      </span>
    </a>
  )
}

export default function Header() {
  const route = useRoute()
  const inbox = useInbox()
  const { meId } = useData()
  const badges: Partial<Record<Route['name'], number>> = {
    messages: unreadMessageCount(inbox.conversations),
    notifications: unreadNotificationCount(inbox.notifications),
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper">
      <div className="grid grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <div className="col-start-1 row-start-1 py-3 md:py-0">
          <Logo />
        </div>

        <nav
          aria-label="Primary"
          className="col-span-2 row-start-2 flex justify-around border-t border-line md:col-span-1 md:col-start-2 md:row-start-1 md:justify-center md:gap-1 md:border-t-0 lg:gap-2"
        >
          {nav.map(({ route: name, label, href: baseHref, Icon, ActiveIcon }) => {
            const badge = badges[name]
            const href = name === 'uploads' ? paths.uploads(meId) : baseHref
            // Other people's uploads are reached from their profiles, so the tab is only current on your own.
            const active = name === 'uploads' ? route.name === 'uploads' && route.id === meId : route.name === name
            const Current = active ? ActiveIcon : Icon
            return (
              <a
                key={name}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex h-12 min-w-12 items-center justify-center gap-3 px-3 text-sm font-medium md:h-16 lg:px-4 ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="relative">
                  <Current className={`size-6 ${active ? 'text-accent' : ''}`} aria-hidden="true" />
                  {badge ? (
                    <span className="fc-border absolute -right-2.5 -top-2 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-ink">
                      {badge}
                      <span className="sr-only"> unread</span>
                    </span>
                  ) : null}
                </span>
                <span className="sr-only lg:not-sr-only">{label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent transition-transform motion-reduce:transition-none ${
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'
                  }`}
                />
              </a>
            )
          })}
        </nav>

        <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-3 md:col-start-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
