import { useState } from 'react'
import KindFilter, { type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { uploads } from '../data/uploads.ts'
import { findUser } from '../data/users.ts'
import { paths } from '../lib/router.ts'

export default function UploadsPage({ userId }: { userId?: string }) {
  const [kind, setKind] = useState<KindFilterValue>('all')
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

      <KindFilter value={kind} onChange={setKind} />

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
