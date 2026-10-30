import { useState } from 'react'
import {
  ChatBubbleOvalLeftIcon,
  DocumentTextIcon,
  HeartIcon as HeartOutline,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import type { Upload, UploadKind } from '../data/types.ts'
import { getUser } from '../data/users.ts'
import { ago, compact } from '../lib/format.ts'
import { paths } from '../lib/router.ts'
import Artwork from './Artwork.tsx'
import Avatar from './Avatar.tsx'

const kindMeta: Record<UploadKind, { label: string; Icon: typeof PhotoIcon }> = {
  photo: { label: 'Photo', Icon: PhotoIcon },
  audio: { label: 'Audio', Icon: MusicalNoteIcon },
  video: { label: 'Video', Icon: VideoCameraIcon },
  writing: { label: 'Writing', Icon: DocumentTextIcon },
}

export default function UploadCard({ upload }: { upload: Upload }) {
  const author = getUser(upload.userId)
  const [liked, setLiked] = useState(false)
  const { label, Icon } = kindMeta[upload.kind]

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="relative">
        <Artwork seed={upload.seed} hue={author.hue} kind={upload.kind} className="aspect-[4/3]" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
          {upload.duration && <span className="tabular-nums opacity-80">· {upload.duration}</span>}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug">{upload.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">{upload.caption}</p>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {upload.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              #{tag}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <a href={paths.profile(author.id)} className="flex min-w-0 items-center gap-2.5">
            <Avatar user={author} size="sm" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">{author.name}</span>
              <span className="block text-xs text-muted">{ago(upload.createdAt)} ago</span>
            </span>
          </a>

          <div className="flex items-center gap-1 text-sm text-muted">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              aria-pressed={liked}
              aria-label="Like"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 hover:bg-surface-2 hover:text-ink"
            >
              {liked ? (
                <HeartSolid className="size-5 text-accent" aria-hidden="true" />
              ) : (
                <HeartOutline className="size-5" aria-hidden="true" />
              )}
              <span className="tabular-nums">{compact(upload.likes + (liked ? 1 : 0))}</span>
            </button>
            <span className="inline-flex items-center gap-1 px-2 py-1.5">
              <ChatBubbleOvalLeftIcon className="size-5" aria-hidden="true" />
              <span className="tabular-nums">{compact(upload.comments)}</span>
              <span className="sr-only">comments</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
