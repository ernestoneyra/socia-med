import type { ComponentType, SVGProps } from 'react'
import {
  ArrowUpTrayIcon,
  ChatBubbleOvalLeftIcon,
  EnvelopeIcon,
  HeartIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import Avatar from '../components/Avatar.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { notifications } from '../data/messages.ts'
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

export default function NotificationsPage() {
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
                className={`flex items-start gap-4 px-4 py-4 hover:bg-surface-2 sm:px-5 ${n.read ? '' : 'bg-accent-soft/50'}`}
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
