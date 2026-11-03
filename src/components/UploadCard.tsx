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
import { setLiked } from '../data/social.ts'
import { useData } from '../data/store.ts'
import { ago, count, isoDuration, spokenDuration } from '../lib/format.ts'
import { paths } from '../lib/router.ts'
import Artwork from './Artwork.tsx'
import Avatar from './Avatar.tsx'
import GlossaryText from './GlossaryText.tsx'

const kindMeta: Record<UploadKind, { label: string; Icon: typeof PhotoIcon }> = {
  photo: { label: 'Photo', Icon: PhotoIcon },
  audio: { label: 'Audio', Icon: MusicalNoteIcon },
  video: { label: 'Video', Icon: VideoCameraIcon },
  writing: { label: 'Writing', Icon: DocumentTextIcon },
}

export default function UploadCard({ upload }: { upload: Upload }) {
  const { getUser } = useData()
  const author = getUser(upload.userId)
  const { label, Icon } = kindMeta[upload.kind]

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="relative">
        {upload.mediaUrl && upload.kind === 'photo' ? (
          <img
            src={upload.mediaUrl}
            alt={upload.alt ?? ''}
            loading="lazy"
            className="aspect-[4/3] w-full bg-surface-2 object-cover"
          />
        ) : upload.mediaUrl && upload.kind === 'video' ? (
          <video
            src={upload.mediaUrl}
            controls
            preload="metadata"
            aria-label={`Video: ${upload.title}`}
            className="aspect-[4/3] w-full bg-black object-contain"
          />
        ) : (
          <Artwork
            seed={upload.seed}
            hue={author.hue}
            kind={upload.kind}
            label={`Generated ${label.toLowerCase()} artwork for “${upload.title}”`}
            className="aspect-[4/3]"
          />
        )}
        {/* Near-opaque so the white text stays above 7:1 on any artwork behind it (SC 1.4.6). */}
        <span className="fc-border absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1 text-xs font-medium text-white">
          <Icon className="size-4" aria-hidden="true" />
          {label}
          {upload.duration && (
            <time dateTime={isoDuration(upload.duration)} className="tabular-nums">
              <span aria-hidden="true">· {upload.duration}</span>
              <span className="sr-only">, {spokenDuration(upload.duration)} long</span>
            </time>
          )}
        </span>
      </div>
      {upload.mediaUrl && upload.kind === 'audio' && (
        <audio src={upload.mediaUrl} controls preload="none" aria-label={`Audio: ${upload.title}`} className="w-full" />
      )}

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold">
            <GlossaryText text={upload.title} />
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            <GlossaryText text={upload.caption} />
          </p>
        </div>

        <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
          {upload.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              #{tag}
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted">
          Posted <time dateTime={upload.createdAt}>{ago(upload.createdAt)}</time>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-3 border-t border-line pt-3">
          <a href={paths.profile(author.id)} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <Avatar user={author} size="sm" />
            <span className="min-w-0 break-words text-sm font-medium">
              <span className="sr-only">Profile of </span>
              {author.name}
            </span>
          </a>

          <div className="flex items-center gap-1 text-sm text-muted">
            <button
              type="button"
              onClick={() => setLiked(upload.id, !upload.likedByMe)}
              aria-pressed={upload.likedByMe}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 hover:bg-surface-2 hover:text-ink"
            >
              {upload.likedByMe ? (
                <HeartSolid className="size-5 text-accent" aria-hidden="true" />
              ) : (
                <HeartOutline className="size-5" aria-hidden="true" />
              )}
              <span className="sr-only">Like, </span>
              <span className="tabular-nums">{count(upload.likes)}</span>
            </button>
            <span className="inline-flex min-h-11 items-center gap-1 px-3">
              <ChatBubbleOvalLeftIcon className="size-5" aria-hidden="true" />
              <span className="tabular-nums">{count(upload.comments)}</span>
              <span className="sr-only">comments</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
