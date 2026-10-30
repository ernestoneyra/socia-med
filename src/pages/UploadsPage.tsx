import { useState } from 'react'
import PageHeading from '../components/PageHeading.tsx'
import UploadCard from '../components/UploadCard.tsx'
import type { UploadKind } from '../data/types.ts'
import { uploads } from '../data/uploads.ts'
import { findUser } from '../data/users.ts'
import { paths } from '../lib/router.ts'

const filters: { value: UploadKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'photo', label: 'Photos' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'writing', label: 'Writing' },
]

export default function UploadsPage({ userId }: { userId?: string }) {
  const [kind, setKind] = useState<UploadKind | 'all'>('all')
  const owner = userId ? findUser(userId) : undefined

  const scoped = owner ? uploads.filter((u) => u.userId === owner.id) : uploads
  const visible = kind === 'all' ? scoped : scoped.filter((u) => u.kind === kind)

  return (
    <>
      <PageHeading
        title={owner ? `Uploads by ${owner.name}` : 'Uploads'}
        subtitle={`${scoped.length} ${scoped.length === 1 ? 'upload' : 'uploads'} in total.`}
      >
        {owner && (
          <a href={paths.uploads()} className="text-sm font-medium text-accent hover:underline">
            Show everyone’s uploads
          </a>
        )}
      </PageHeading>

      <div role="group" aria-label="Filter by type" className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={kind === f.value}
            onClick={() => setKind(f.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              kind === f.value
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line bg-surface text-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
          Nothing here yet.
        </p>
      )}
    </>
  )
}
