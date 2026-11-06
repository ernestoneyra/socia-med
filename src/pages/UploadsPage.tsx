import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import KindFilter, { filterByKinds, type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import ShrugIcon from '../components/ShrugIcon.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { plural } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function UploadsPage({ userId }: { userId?: string }) {
  const { uploads, findUser } = useData()
  const [kinds, setKinds] = useState<KindFilterValue>([])
  const owner = userId ? findUser(userId) : undefined

  const scoped = owner ? uploads.filter((u) => u.userId === owner.id) : uploads
  const visible = filterByKinds(scoped, kinds)

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
      />

      <KindFilter value={kinds} onChange={setKinds} />
      <Status>{plural(visible.length, 'upload')} shown.</Status>

      <h2 className="sr-only">Upload list</h2>
      {visible.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center text-muted">
          <ShrugIcon className="size-24" />
          <p>Nothing here yet.</p>
        </div>
      )}
    </>
  )
}
