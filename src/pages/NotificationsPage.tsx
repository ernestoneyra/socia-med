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
import { useData, type Data } from '../data/store.ts'
import type { MessageKey } from '../i18n/core.ts'
import { useT, type T } from '../i18n/useT.tsx'
import { ago } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

// Each notification is one whole sentence, so every language can put its words in its own order.
// `text` names the upload; `bare` is used when that upload is gone.
const meta: Record<
  NotificationType,
  { Icon: ComponentType<SVGProps<SVGSVGElement>>; text: MessageKey; bare: MessageKey }
> = {
  like: { Icon: HeartIcon, text: 'notifications.like', bare: 'notifications.likeBare' },
  comment: { Icon: ChatBubbleOvalLeftIcon, text: 'notifications.comment', bare: 'notifications.commentBare' },
  follow: { Icon: UserPlusIcon, text: 'notifications.follow', bare: 'notifications.follow' },
  message: { Icon: EnvelopeIcon, text: 'notifications.message', bare: 'notifications.message' },
  upload: { Icon: ArrowUpTrayIcon, text: 'notifications.upload', bare: 'notifications.uploadBare' },
}

function target(n: Notification, { getUpload }: Data): string {
  if (n.type === 'follow') return paths.profile(n.actorId)
  if (n.type === 'message') return paths.messages(n.actorId)
  const upload = n.uploadId ? getUpload(n.uploadId) : undefined
  return upload ? paths.uploads(upload.userId) : paths.home
}

/** Where the link goes, spoken after the notification text (WCAG 2.4.9 Link Purpose, link only). */
function destination(n: Notification, actorName: string, { getUpload, getUser }: Data, t: T): string {
  if (n.type === 'follow') return t('notifications.opensProfile', { name: actorName })
  if (n.type === 'message') return t('notifications.opensConversation', { name: actorName })
  const upload = n.uploadId ? getUpload(n.uploadId) : undefined
  return upload ? t('notifications.opensUploads', { name: getUser(upload.userId).name }) : t('notifications.opensHome')
}

export default function NotificationsPage() {
  const t = useT()
  const data = useData()
  const { getUpload, getUser } = data
  const { notifications } = useInbox()
  const unread = unreadNotificationCount(notifications)
  const [announcement, setAnnouncement] = useState('')

  // Nothing is marked as read on a timer: that would be content changing by itself, which
  // people who read slowly or use a screen reader cannot pause (WCAG 2.2.2, 2.2.3).
  // Notifications are read by opening them or with the button below.
  function markAll() {
    if (unread === 0) return
    markAllNotificationsRead()
    setAnnouncement(t('notifications.markedAll'))
  }

  return (
    <>
      <PageHeading title={t('nav.notifications')} subtitle={t('notifications.subtitle')}>
        {/* aria-disabled instead of disabled, so keyboard focus is not lost when the last one is read. */}
        <button
          type="button"
          onClick={markAll}
          aria-disabled={unread === 0}
          className={`inline-flex min-h-11 items-center rounded-full border border-edge px-5 text-sm font-medium ${
            unread === 0 ? 'text-muted' : 'text-ink hover:bg-surface-2'
          }`}
        >
          {t('notifications.markAll')}
        </button>
      </PageHeading>

      <Status>{announcement}</Status>
      <p className="mb-4 text-sm text-muted">
        {unread === 0 ? t('notifications.none') : t('count.unreadNotifications', { n: unread })}
      </p>

      <h2 className="sr-only">{t('notifications.all')}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {notifications.map((n) => {
          const actor = getUser(n.actorId)
          const upload = n.uploadId ? getUpload(n.uploadId) : undefined
          const { Icon, text, bare } = meta[n.type]
          return (
            <li key={n.id}>
              <a
                href={target(n, data)}
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
                  {t.rich(upload ? text : bare, { actor: actor.name, title: upload?.title ?? '' }, {
                    actor: (name) => <span className="font-semibold">{name}</span>,
                    title: (title) => <span className="font-medium">{title}</span>,
                  })}
                  {n.text && (
                    <span className="mt-1 block text-muted">
                      {n.type === 'comment' ? t('notifications.commentText', { text: n.text }) : n.text}
                    </span>
                  )}
                  <span className="mt-1 block text-muted">
                    <time dateTime={n.createdAt}>{ago(n.createdAt)}</time>
                    {!n.read && <span className="ml-2 font-semibold text-accent">{t('notifications.new')}</span>}
                  </span>
                  <span className="sr-only">{destination(n, actor.name, data, t)}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}
