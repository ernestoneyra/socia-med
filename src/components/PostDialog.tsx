import { useEffect, useId, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Upload } from '../data/types.ts'
import { ago } from '../lib/format.ts'
import GlossaryText from './GlossaryText.tsx'

/**
 * Shows a post's full title and description when the card had to cut them short.
 * Built on the native <dialog>, like the other dialogs, so focus stays inside, Escape closes it
 * and focus goes back to the "Read more" button that opened it.
 */
export default function PostDialog({
  open,
  upload,
  authorName,
  onClose,
}: {
  open: boolean
  upload: Upload
  authorName: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Close the native dialog directly; its "close" event then tells the card to update its state.
  function closeDialog() {
    if (ref.current?.open) ref.current.close()
    else onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, but so does a click on its padding,
      // so check where the pointer is against the dialog's box.
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const box = event.currentTarget.getBoundingClientRect()
        const outside =
          event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
        if (outside) closeDialog()
      }}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(40rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-5 text-ink shadow-card backdrop:bg-black/70 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={headingId} className="min-w-0 break-words font-display text-2xl font-semibold">
          <GlossaryText text={upload.title} />
        </h2>
        <button
          type="button"
          onClick={closeDialog}
          className="-mr-2 -mt-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <p className="mt-1 text-sm text-muted">
        By {authorName} · Posted <time dateTime={upload.createdAt}>{ago(upload.createdAt)}</time>
      </p>

      <p className="mt-4 whitespace-pre-line break-words leading-relaxed">
        <GlossaryText text={upload.caption} />
      </p>

      {upload.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-1.5">
          {upload.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </dialog>
  )
}
