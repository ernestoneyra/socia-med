import { useEffect, useId, useRef, useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useT } from '../i18n/useT.tsx'

/**
 * Asks before something is deleted for good. Built on the native <dialog>, like the post form,
 * so focus stays inside, Escape closes it and focus goes back to the button that opened it.
 */
export default function ConfirmDeleteDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean
  /** The post's title, repeated back so it is clear what will go. */
  title: string
  onCancel: () => void
  onConfirm: () => Promise<boolean>
}) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setFailed(false)
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function confirm() {
    if (busy) return
    setBusy(true)
    setFailed(false)
    const ok = await onConfirm()
    setBusy(false)
    if (!ok) setFailed(true)
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onClose={onCancel}
      className="m-auto w-[min(28rem,calc(100%-1.5rem))] rounded-3xl border border-line bg-surface p-5 text-ink shadow-card backdrop:bg-black/70 sm:p-6"
    >
      <h2 id={headingId} className="font-display text-2xl font-semibold">
        {t('delete.title')}
      </h2>
      <p className="mt-3 break-words">
        {t('delete.body', { title })}
      </p>
      {failed && (
        <p role="alert" className="mt-4 flex items-start gap-1.5 rounded-xl border-2 border-accent px-4 py-3 text-sm font-medium">
          <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('delete.failed')}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          // Cancel is the default choice, so a stray Enter does not delete anything.
          autoFocus
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          aria-disabled={busy}
          className="fc-border inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {busy ? t('delete.busy') : t('delete.confirm')}
        </button>
      </div>
    </dialog>
  )
}
