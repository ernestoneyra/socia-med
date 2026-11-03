import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import KindFilter, { type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { plural } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function UploadsPage({ userId }: { userId?: string }) {
  const { uploads, findUser } = useData()
  const [kind, setKind] = useState<KindFilterValue>('all')
  const owner = userId ? findUser(userId) : undefined

  const scoped = owner ? uploads.filter((u) => u.userId === owner.id) : uploads
  const visible = kind === 'all' ? scoped : scoped.filter((u) => u.kind === kind)

  return (
    <>
      {owner && (
        <Breadcrumbs
          items={[
            { label: 'Home', href: paths.home },
            { label: 'Uploads', href: paths.uploads() },
            { label: owner.name },
          ]}
        />
      )}
      <PageHeading
        title={owner ? `Uploads by ${owner.name}` : 'Uploads'}
        subtitle={`${plural(scoped.length, 'upload')} in total.`}
      >
        {owner && (
          <a
            href={paths.uploads()}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Show everyone’s uploads
          </a>
        )}
      </PageHeading>

      <KindFilter value={kind} onChange={setKind} />
      <Status>{plural(visible.length, 'upload')} shown.</Status>

      <h2 className="sr-only">Upload list</h2>
      {visible.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
          Nothing here yet.
        </p>
      )}
    </>
  )
}
