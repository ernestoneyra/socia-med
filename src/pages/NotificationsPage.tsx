import { useState, type ComponentType, type SVGProps } from 'react'
import {
  ArrowUpTrayIcon,
  ChatBubbleOvalLeftIcon,
  EnvelopeIcon,
  HeartIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import Avatar from '../components/Avatar.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import { markAllNotificationsRead, markNotificationRead, unreadNotificationCount, useInbox } from '../data/inbox.ts'
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

/** Where the link goes, spoken after the notification text (WCAG 2.4.9 Link Purpose, link only). */
function destination(n: Notification, actorName: string): string {
  if (n.type === 'follow') return `Opens the profile of ${actorName}.`
  if (n.type === 'message') return `Opens your conversation with ${actorName}.`
  const upload = n.uploadId ? getUpload(n.uploadId) : undefined
  return upload ? `Opens the uploads of ${getUser(upload.userId).name}.` : 'Opens the home page.'
}

export default function NotificationsPage() {
  const { notifications } = useInbox()
  const unread = unreadNotificationCount(notifications)
  const [announcement, setAnnouncement] = useState('')

  // Nothing is marked as read on a timer: that would be content changing by itself, which
  // people who read slowly or use a screen reader cannot pause (WCAG 2.2.2, 2.2.3).
  // Notifications are read by opening them or with the button below.
  function markAll() {
    if (unread === 0) return
    markAllNotificationsRead()
    setAnnouncement('All notifications marked as read.')
  }

  return (
    <>
      <PageHeading title="Notifications" subtitle="Likes, comments, new followers and fresh uploads.">
        {/* aria-disabled instead of disabled, so keyboard focus is not lost when the last one is read. */}
        <button
          type="button"
          onClick={markAll}
          aria-disabled={unread === 0}
          className={`inline-flex min-h-11 items-center rounded-full border border-edge px-5 text-sm font-medium ${
            unread === 0 ? 'text-muted' : 'text-ink hover:bg-surface-2'
          }`}
        >
          Mark all as read
        </button>
      </PageHeading>

      <Status>{announcement}</Status>
      <p className="mb-4 text-sm text-muted">
        {unread === 0 ? 'You have no unread notifications.' : `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}.`}
      </p>

      <h2 className="sr-only">All notifications</h2>
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
                className={`flex items-start gap-4 px-4 py-4 transition-colors duration-500 hover:bg-surface-2 focus-visible:-outline-offset-4 sm:px-5 ${n.read ? '' : 'bg-accent-soft/50'}`}
              >
                <span className="relative shrink-0">
                  <Avatar user={actor} />
                  <span className="fc-border absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-accent text-accent-ink ring-2 ring-surface">
                    <Icon className="size-3" aria-hidden="true" />
                  </span>
                </span>
                <span className="min-w-0 max-w-prose flex-1 text-sm">
                  <span className="font-semibold">{actor.name}</span> {verb}
                  {upload && n.type !== 'upload' && <> your upload</>}
                  {upload && <> <span className="font-medium">“{upload.title}”</span></>}
                  {n.text && <span className="mt-1 block text-muted">{n.type === 'comment' ? `“${n.text}”` : n.text}</span>}
                  <span className="mt-1 block text-muted">
                    <time dateTime={n.createdAt}>{ago(n.createdAt)}</time>
                    {!n.read && <span className="ml-2 font-semibold text-accent">New</span>}
                  </span>
                  <span className="sr-only">. {destination(n, actor.name)}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}
