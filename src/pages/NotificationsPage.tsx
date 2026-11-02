import { useEffect, useRef, type ComponentType, type SVGProps } from 'react'
import {
  ArrowUpTrayIcon,
  ChatBubbleOvalLeftIcon,
  EnvelopeIcon,
  HeartIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import Avatar from '../components/Avatar.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { markNotificationRead, useInbox } from '../data/inbox.ts'
import type { Notification, NotificationType } from '../data/types.ts'
import { getUpload } from '../data/uploads.ts'
import { getUser } from '../data/users.ts'
import { ago } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

const meta: Record<NotificationType, { Icon: ComponentType<SVGProps<SVGSVGElement>>; verb: string }> = {
  like: { Icon: HeartIcon, verb: 'liked' },
  comment: { Icon: ChatBubbleOvalLeftIcon, verb: 'commented on' },
  follow: { Icon: UserPlusIcon, verb: 'started following you' },
  message: { Icon: EnvelopeIcon, verb: 'sent you a message' },
  upload: { Icon: ArrowUpTrayIcon, verb: 'shared a new upload' },
}

function target(n: Notification): string {
  if (n.type === 'follow') return paths.profile(n.actorId)
  if (n.type === 'message') return paths.messages(n.actorId)
  const upload = n.uploadId ? getUpload(n.uploadId) : undefined
  return upload ? paths.uploads(upload.userId) : paths.home
}

// Pause before the first tag clears, then clear the rest one at a time.
const FIRST_DELAY_MS = 1200
const STEP_MS = 700

export default function NotificationsPage() {
  const { notifications } = useInbox()

  // Each tag goes away on its own once you've had a moment to see it: clearing one
  // re-runs this effect for the next unread notification, so they drop off in sequence.
  const nextUnreadId = notifications.find((n) => !n.read)?.id
  const started = useRef(false)
  useEffect(() => {
    if (!nextUnreadId) return
    const id = window.setTimeout(
      () => {
        started.current = true
        markNotificationRead(nextUnreadId)
      },
      started.current ? STEP_MS : FIRST_DELAY_MS,
    )
    return () => window.clearTimeout(id)
  }, [nextUnreadId])

  return (
    <>
      <PageHeading title="Notifications" subtitle="Likes, comments, new followers and fresh uploads." />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {notifications.map((n) => {
          const actor = getUser(n.actorId)
          const upload = n.uploadId ? getUpload(n.uploadId) : undefined
          const { Icon, verb } = meta[n.type]
          return (
            <li key={n.id}>
              <a
                href={target(n)}
                onClick={() => markNotificationRead(n.id)}
                className={`flex items-start gap-4 px-4 py-4 transition-colors duration-500 hover:bg-surface-2 sm:px-5 ${n.read ? '' : 'bg-accent-soft/50'}`}
              >
                <span className="relative shrink-0">
                  <Avatar user={actor} />
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-accent text-accent-ink ring-2 ring-surface">
                    <Icon className="size-3" aria-hidden="true" />
                  </span>
                </span>
                <span className="min-w-0 flex-1 text-sm leading-relaxed">
                  <span className="font-semibold">{actor.name}</span> {verb}
                  {upload && n.type !== 'upload' && <> your upload</>}
                  {upload && <> <span className="font-medium">“{upload.title}”</span></>}
                  {n.text && <span className="mt-1 block text-muted">{n.type === 'comment' ? `“${n.text}”` : n.text}</span>}
                  <span className="mt-1 block text-xs text-muted">
                    {ago(n.createdAt)} ago
                    {!n.read && <span className="ml-2 font-semibold text-accent">New</span>}
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}
