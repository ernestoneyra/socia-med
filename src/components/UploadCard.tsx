import { useLayoutEffect, useRef, useState } from 'react'
import {
  ChatBubbleOvalLeftIcon,
  DocumentTextIcon,
  HeartIcon as HeartOutline,
  MusicalNoteIcon,
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import type { Upload, UploadKind } from '../data/types.ts'
import { m, type MessageKey } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { deletePost, setLiked } from '../data/social.ts'
import { useData } from '../data/store.ts'
import { ago, count, isoDuration, spokenDuration } from '../lib/format.ts'
import { announce } from '../lib/announce.ts'
import { paths } from '../lib/router.ts'
import Artwork from './Artwork.tsx'
import Avatar from './Avatar.tsx'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.tsx'
import CreatePostDialog from './CreatePostDialog.tsx'
import GlossaryText from './GlossaryText.tsx'
import PostDialog from './PostDialog.tsx'

const kindMeta: Record<UploadKind, { label: MessageKey; Icon: typeof PhotoIcon }> = {
  photo: { label: 'card.kindPhoto', Icon: PhotoIcon },
  audio: { label: 'card.kindAudio', Icon: MusicalNoteIcon },
  video: { label: 'card.kindVideo', Icon: VideoCameraIcon },
  writing: { label: 'card.kindWriting', Icon: DocumentTextIcon },
}

export default function UploadCard({ upload }: { upload: Upload }) {
  const t = useT()
  const { getUser, meId } = useData()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reading, setReading] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const own = upload.userId === meId
  const author = getUser(upload.userId)
  const { label, Icon } = kindMeta[upload.kind]
  const title = upload.title

  // Offer "Read more" only when the title or description is actually cut off at this card width.
  useLayoutEffect(() => {
    const title = titleRef.current
    const caption = captionRef.current
    if (!title || !caption) return
    const check = () =>
      setTruncated(title.scrollHeight > title.clientHeight + 1 || caption.scrollHeight > caption.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(title)
    observer.observe(caption)
    return () => observer.disconnect()
  }, [upload.title, upload.caption])

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="relative">
        {upload.mediaUrl && upload.kind === 'photo' ? (
          <img
            src={upload.mediaUrl}
            alt={t('card.photoAlt', { title })}
            loading="lazy"
            className="aspect-[4/3] w-full bg-surface-2 object-cover"
          />
        ) : upload.mediaUrl && upload.kind === 'video' ? (
          <video
            src={upload.mediaUrl}
            controls
            preload="metadata"
            aria-label={t('card.videoLabel', { title })}
            className="aspect-[4/3] w-full bg-black object-contain"
          />
        ) : (
          <Artwork
            seed={upload.seed}
            hue={author.hue}
            kind={upload.kind}
            label={t('card.artwork', { kind: m(`kind.${upload.kind}`), title })}
            className="aspect-[4/3]"
          />
        )}
        {/* Near-opaque so the white text stays above 7:1 on any artwork behind it (SC 1.4.6). */}
        <span className="fc-border absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1 text-xs font-medium text-white">
          <Icon className="size-4" aria-hidden="true" />
          {t(label)}
          {upload.duration && (
            <time dateTime={isoDuration(upload.duration)} className="tabular-nums">
              <span aria-hidden="true">· {upload.duration}</span>
              <span className="sr-only">{t('card.durationSpoken', { duration: spokenDuration(upload.duration) })}</span>
            </time>
          )}
        </span>
      </div>
      {upload.mediaUrl && upload.kind === 'audio' && (
        <audio src={upload.mediaUrl} controls preload="none" aria-label={t('card.audioLabel', { title })} className="w-full" />
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title and description take a fixed amount of room, so the tags and everything below
            start at the same place on every card. Longer text is cut and opens in a dialog. */}
        <div>
          <h3 ref={titleRef} className="line-clamp-2 min-h-[1.3lh] break-words font-display text-lg font-semibold">
            <GlossaryText text={upload.title} />
          </h3>
          <p ref={captionRef} className="mt-1 line-clamp-2 min-h-[2lh] break-words text-sm leading-relaxed text-muted">
            <GlossaryText text={upload.caption} />
          </p>
          {/* Third row of the description: one line tall, with the button's 44px target reaching
              down into the empty space under it. */}
          <div className="relative h-[1lh] text-sm leading-relaxed">
            {truncated && (
              <button
                type="button"
                onClick={() => setReading(true)}
                aria-haspopup="dialog"
                className="absolute left-0 top-0 inline-flex min-h-11 min-w-11 items-start text-[12px] font-medium text-ink underline underline-offset-2 hover:text-accent"
              >
                {t('card.readMore')}
                <span className="sr-only">{t('card.readMoreOf', { title })}</span>
              </button>
            )}
          </div>
          <PostDialog open={reading} upload={upload} authorName={author.name} onClose={() => setReading(false)} />
        </div>

        <ul aria-label={t('card.tags')} className="flex flex-wrap gap-1.5">
          {upload.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              #{tag}
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted">
          {t.rich('card.posted', { when: ago(upload.createdAt) }, {
            time: (text) => <time dateTime={upload.createdAt}>{text}</time>,
          })}
        </p>

        {own && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-edge px-4 text-sm font-medium hover:bg-surface-2"
            >
              <PencilSquareIcon className="size-4" aria-hidden="true" />
              {t('card.edit')}
              <span className="sr-only">{t('card.ofTitle', { title })}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-edge px-4 text-sm font-medium hover:bg-surface-2"
            >
              <TrashIcon className="size-4" aria-hidden="true" />
              {t('card.delete')}
              <span className="sr-only">{t('card.ofTitle', { title })}</span>
            </button>
            <CreatePostDialog
              open={editing}
              editing={upload}
              onClose={() => setEditing(false)}
              onSaved={() => {
                setEditing(false)
                announce(t('card.saved', { title }))
              }}
            />
            <ConfirmDeleteDialog
              open={deleting}
              title={upload.title}
              onCancel={() => setDeleting(false)}
              onConfirm={async () => {
                const ok = await deletePost(upload.id)
                if (ok) {
                  // The card is gone, so put focus on the page heading rather than on nothing.
                  // Wait a tick: the modal must be gone from the page before focus can move out of it.
                  setTimeout(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }), 0)
                  announce(t('card.deleted', { title }))
                }
                return ok
              }}
            />
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 border-t border-line pt-3">
          <a href={paths.profile(author.id)} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <Avatar user={author} size="sm" />
            <span className="min-w-0 break-words text-sm font-medium">
              <span className="sr-only">{t('card.profileOf')}</span>
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
              <span className="sr-only">{t('card.like')}</span>
              <span className="tabular-nums">{count(upload.likes)}</span>
            </button>
            <span className="inline-flex min-h-11 items-center gap-1 px-3">
              <ChatBubbleOvalLeftIcon className="size-5" aria-hidden="true" />
              <span className="tabular-nums">{count(upload.comments)}</span>
              <span className="sr-only">{t('card.comments')}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
