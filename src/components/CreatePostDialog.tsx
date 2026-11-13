import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { createPost, updatePost } from '../data/social.ts'
import {
  MAX_CAPTION,
  MAX_MEDIA_BYTES,
  MAX_TAGS,
  MAX_TITLE,
  acceptFor,
  hasFile,
  parseTags,
  readableSize,
  validateFile,
  validatePost,
  type PostErrors,
} from '../data/postRules.ts'
import type { Upload, UploadKind } from '../data/types.ts'
import { m, type MessageKey } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { fieldClass } from '../lib/formStyles.ts'
import { readDuration } from '../lib/media.ts'
import FieldError from './FieldError.tsx'
import Status from './Status.tsx'

const kinds: { value: UploadKind; label: MessageKey; Icon: typeof PhotoIcon }[] = [
  { value: 'photo', label: 'card.kindPhoto', Icon: PhotoIcon },
  { value: 'audio', label: 'card.kindAudio', Icon: MusicalNoteIcon },
  { value: 'video', label: 'card.kindVideo', Icon: VideoCameraIcon },
  { value: 'writing', label: 'card.kindWriting', Icon: DocumentTextIcon },
]

const fileTypes: Record<'photo' | 'audio' | 'video', MessageKey> = {
  photo: 'post.fileTypesPhoto',
  audio: 'post.fileTypesAudio',
  video: 'post.fileTypesVideo',
}

const fileLabel: Record<'photo' | 'audio' | 'video', MessageKey> = {
  photo: 'post.photoFile',
  audio: 'post.audioFile',
  video: 'post.videoFile',
}

function PostForm({
  editing,
  onClose,
  onSaved,
}: {
  /** Set when changing an existing post: only its text can change, not its type or file. */
  editing?: Upload
  onClose: () => void
  onSaved: (post: Upload) => void
}) {
  const t = useT()
  const uid = useId()
  const [kind, setKind] = useState<UploadKind>(editing?.kind ?? 'photo')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [caption, setCaption] = useState(editing?.caption ?? '')
  const [tagText, setTagText] = useState(editing?.tags.join(' ') ?? '')
  const [file, setFile] = useState<File>()
  const [errors, setErrors] = useState<PostErrors>({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const id = (name: string) => `${uid}-${name}`
  const describedBy = (name: keyof PostErrors, hint?: string) =>
    [errors[name] ? id(`${name}-error`) : '', hint ? id(`${name}-hint`) : ''].filter(Boolean).join(' ') || undefined

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    const post = { kind, title, caption, tags: parseTags(tagText) }
    const fileError = editing ? undefined : validateFile(kind, file)
    const found = { ...validatePost(post), ...(fileError ? { file: fileError } : {}) }
    setErrors(found)
    setServerError('')
    // Show problems in the order the fields appear on screen.
    const names = (['title', 'file', 'caption', 'tags'] as const).filter((n) => found[n])
    if (names.length) {
      setAnnouncement(t(editing ? 'count.problemsBeforeSaving' : 'count.problemsBeforePosting', { n: names.length }))
      // Take the person to the first problem (SC 3.3.1).
      formRef.current?.querySelector<HTMLElement>(`[name="${names[0]}"]`)?.focus()
      return
    }
    setSaving(true)
    if (editing) {
      setAnnouncement(t('post.saving'))
      const ok = await updatePost(editing.id, post)
      setSaving(false)
      if (ok) {
        onSaved({ ...editing, title: post.title.trim(), caption: post.caption.trim(), tags: post.tags })
      } else {
        setServerError(t('post.saveFailed'))
        setAnnouncement(t('post.saveFailedShort'))
      }
      return
    }
    setAnnouncement(t('post.posting'))
    // The length of audio and video comes from the file, not from the person.
    const duration = file && (kind === 'audio' || kind === 'video') ? await readDuration(file, kind) : undefined
    const saved = await createPost({ ...post, ...(duration ? { duration } : {}) }, file)
    setSaving(false)
    if (saved) {
      onSaved(saved)
    } else {
      setServerError(t('post.postFailed'))
      setAnnouncement(t('post.postFailedShort'))
    }
  }

  const tagCount = parseTags(tagText).length

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
      <Status>{announcement}</Status>

      {!editing && (
      <fieldset>
        <legend className="text-sm font-medium">{t('post.type')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kinds.map(({ value, label, Icon }) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 ${
                kind === value ? 'border-accent bg-accent-soft' : 'border-edge hover:bg-surface-2'
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => {
                  setKind(value)
                  // A photo cannot become a song: the chosen file belongs to the old type.
                  setFile(undefined)
                  setErrors({})
                }}
                className="size-4 shrink-0 accent-accent focus-visible:outline-none"
              />
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {t(label)}
            </label>
          ))}
        </div>
      </fieldset>
      )}

      <div>
        <label htmlFor={id('title')} className="block text-sm font-medium">
          {t('post.title')}
        </label>
        <input
          id={id('title')}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          required
          aria-required="true"
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={describedBy('title')}
          autoComplete="off"
          className={fieldClass(!!errors.title)}
        />
        <FieldError id={id('title-error')}>{errors.title}</FieldError>
      </div>

      {!editing && hasFile(kind) && (
        <div>
          <label htmlFor={id('file')} className="block text-sm font-medium">
            {t(fileLabel[kind])}
          </label>
          <p id={id('file-hint')} className="text-sm text-muted">
            {t('post.fileHint', { types: m(fileTypes[kind]), size: readableSize(MAX_MEDIA_BYTES) })}
          </p>
          {/* Keyed by kind so changing the type also empties the picker. */}
          <input
            key={kind}
            id={id('file')}
            name="file"
            type="file"
            accept={acceptFor(kind)}
            onChange={(e) => {
              setFile(e.target.files?.[0])
              setErrors((prev) => ({ ...prev, file: undefined }))
            }}
            required
            aria-required="true"
            aria-invalid={errors.file ? 'true' : undefined}
            aria-describedby={describedBy('file', 'hint')}
            className={`${fieldClass(!!errors.file)} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-ink`}
          />
          <FieldError id={id('file-error')}>{errors.file}</FieldError>
        </div>
      )}

      <div>
        <label htmlFor={id('caption')} className="block text-sm font-medium">
          {kind === 'writing' ? t('post.excerpt') : t('post.caption')}
          <span className="font-normal text-muted">{t('common.optional')}</span>
        </label>
        <textarea
          id={id('caption')}
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={MAX_CAPTION}
          aria-invalid={errors.caption ? 'true' : undefined}
          aria-describedby={describedBy('caption', 'hint')}
          className={fieldClass(!!errors.caption)}
        />
        <p id={id('caption-hint')} className="mt-1 text-sm tabular-nums text-muted">
          {t('post.charactersUsed', { used: caption.length, max: MAX_CAPTION })}
        </p>
        <FieldError id={id('caption-error')}>{errors.caption}</FieldError>
      </div>

      <div>
        <label htmlFor={id('tags')} className="block text-sm font-medium">
          {t('post.tags')}
          <span className="font-normal text-muted">{t('common.optional')}</span>
        </label>
        <p id={id('tags-hint')} className="text-sm text-muted">
          {t('post.tagsHint', { max: MAX_TAGS })}
          {tagCount > 0 && t('post.tagsEntered', { n: tagCount })}
        </p>
        <input
          id={id('tags')}
          name="tags"
          value={tagText}
          onChange={(e) => setTagText(e.target.value)}
          aria-invalid={errors.tags ? 'true' : undefined}
          aria-describedby={describedBy('tags', 'hint')}
          autoComplete="off"
          className={fieldClass(!!errors.tags)}
        />
        <FieldError id={id('tags-error')}>{errors.tags}</FieldError>
      </div>

      {serverError && (
        <p role="alert" className="flex items-start gap-1.5 rounded-xl border-2 border-accent px-4 py-3 text-sm font-medium">
          <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          aria-disabled={saving}
          className="fc-border inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {saving ? (editing ? t('post.saving') : t('post.posting')) : editing ? t('post.save') : t('post.post')}
        </button>
      </div>
    </form>
  )
}

/**
 * A modal built on the native <dialog>: the browser keeps focus inside, makes the page behind
 * it inert, closes on Escape and returns focus to the button that opened it (SC 2.4.3).
 */
export default function CreatePostDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  /** Pass an existing post to change its text instead of creating a new one. */
  editing?: Upload
  onClose: () => void
  onSaved: (post: Upload) => void
}) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[92svh] w-[min(40rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <h2 id={titleId} className="font-display text-2xl font-semibold">
          {editing ? t('post.editTitle') : t('post.createTitle')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-2"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">{editing ? t('post.closeEdit') : t('post.closeCreate')}</span>
        </button>
      </div>
      {/* Mounted only while open, so every visit starts with an empty form. */}
      {open && <PostForm editing={editing} onClose={onClose} onSaved={onSaved} />}
    </dialog>
  )
}
