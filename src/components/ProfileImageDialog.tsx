import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ProfileImage } from '../data/api.ts'
import { MAX_AVATAR_LABEL, acceptFor, validateAvatar } from '../data/postRules.ts'
import { changeProfileImage, removeProfileImage } from '../data/social.ts'
import type { User } from '../data/types.ts'
import { m, type MessageKey, type Msg } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { fieldClass } from '../lib/formStyles.ts'
import Artwork from './Artwork.tsx'
import Avatar from './Avatar.tsx'
import FieldError from './FieldError.tsx'
import Status from './Status.tsx'

const text = {
  avatar: { title: 'image.avatarTitle', noun: 'photo', label: 'image.avatarFile', current: 'avatarUrl' },
  background: { title: 'image.backgroundTitle', noun: 'background', label: 'image.backgroundFile', current: 'backgroundUrl' },
} as const satisfies Record<
  ProfileImage,
  { title: MessageKey; noun: 'photo' | 'background'; label: MessageKey; current: 'avatarUrl' | 'backgroundUrl' }
>

function ImageForm({
  which,
  user,
  onClose,
  onSaved,
}: {
  which: ProfileImage
  user: User
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const t = useT()
  const meta = text[which]
  // What the image is called inside a sentence: "photo" or "background image".
  const kind = m(`kind.${meta.noun}`)
  const uid = useId()
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const [error, setError] = useState<Msg>()
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hasImage = !!user[meta.current]

  // The preview is a temporary local URL: release it when the file changes or the dialog closes.
  useEffect(() => {
    if (!file) return setPreview(undefined)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    setServerError('')
    const problem = validateAvatar(file, meta.noun)
    setError(problem)
    if (problem || !file) {
      setAnnouncement(t('count.problemsBeforeSaving', { n: 1 }))
      inputRef.current?.focus()
      return
    }
    setSaving(true)
    setAnnouncement(t('post.saving'))
    const ok = await changeProfileImage(which, file)
    setSaving(false)
    if (ok) onSaved(t('image.updated', { kind }))
    else {
      setServerError(t('image.saveFailed', { kind }))
      setAnnouncement(t('image.saveFailedShort', { kind }))
    }
  }

  async function remove() {
    if (saving) return
    setServerError('')
    setSaving(true)
    setAnnouncement(t('image.removing'))
    const ok = await removeProfileImage(which)
    setSaving(false)
    if (ok) onSaved(t('image.removed', { kind }))
    else {
      setServerError(t('image.removeFailed', { kind }))
      setAnnouncement(t('image.removeFailedShort', { kind }))
    }
  }

  const shown = preview ? { ...user, [meta.current]: preview } : user

  return (
    <form onSubmit={submit} noValidate className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
      <Status>{announcement}</Status>

      {/* Decorative preview: the file name next to it says what was chosen. */}
      {which === 'avatar' ? (
        <div className="flex justify-center">
          <Avatar user={shown} size="xl" />
        </div>
      ) : shown.backgroundUrl ? (
        <img src={shown.backgroundUrl} alt="" className="h-32 w-full rounded-2xl bg-surface-2 object-cover sm:h-40" />
      ) : (
        <Artwork seed={user.hue + 7} hue={user.hue} kind="photo" className="h-32 rounded-2xl sm:h-40" />
      )}

      <div>
        <label htmlFor={`${uid}-file`} className="block text-sm font-medium">
          {t(meta.label)}
        </label>
        <p id={`${uid}-hint`} className="text-sm text-muted">
          {t('post.fileHint', { types: m('post.fileTypesPhoto'), size: MAX_AVATAR_LABEL })}
        </p>
        <input
          ref={inputRef}
          id={`${uid}-file`}
          name="file"
          type="file"
          accept={acceptFor('photo')}
          onChange={(e) => {
            setFile(e.target.files?.[0])
            setError(undefined)
          }}
          required
          aria-required="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[error ? `${uid}-error` : '', `${uid}-hint`].filter(Boolean).join(' ')}
          className={`${fieldClass(!!error)} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-ink`}
        />
        <FieldError id={`${uid}-error`}>{error}</FieldError>
      </div>

      {serverError && (
        <p role="alert" className="flex items-start gap-1.5 rounded-xl border-2 border-accent px-4 py-3 text-sm font-medium">
          <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
        {hasImage ? (
          <button
            type="button"
            onClick={remove}
            aria-disabled={saving}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2 aria-disabled:cursor-wait aria-disabled:opacity-70"
          >
            {t('image.remove', { kind })}
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
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
            {saving ? t('post.saving') : t('image.save', { kind })}
          </button>
        </div>
      </div>
    </form>
  )
}

/** A modal built on the native <dialog>, like the post dialog: focus stays inside and returns to the opener. */
export default function ProfileImageDialog({
  which,
  open,
  user,
  onClose,
  onSaved,
}: {
  /** The profile photo, or the image behind the profile. */
  which: ProfileImage
  open: boolean
  user: User
  onClose: () => void
  onSaved: (message: string) => void
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
      className="m-auto max-h-[92svh] w-[min(28rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <h2 id={titleId} className="font-display text-2xl font-semibold">
          {t(text[which].title)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-2"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">{t('post.closeEdit')}</span>
        </button>
      </div>
      {open && <ImageForm which={which} user={user} onClose={onClose} onSaved={onSaved} />}
    </dialog>
  )
}
