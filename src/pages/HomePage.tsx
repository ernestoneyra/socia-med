import { useState } from 'react'
import KindFilter, { filterByKinds, type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { plural } from '../lib/format.ts'

export default function HomePage() {
  const { me, uploads } = useData()
  const [kinds, setKinds] = useState<KindFilterValue>([])
  const visible = filterByKinds(uploads, kinds)

  return (
    <>
      <PageHeading
        title={`Hello, ${me.name.split(' ')[0]}`}
        subtitle="Fresh work from the people you follow: photographs, recordings, rides and essays, newest first."
      />

      <KindFilter value={kinds} onChange={setKinds} />
      <Status>{plural(visible.length, 'upload')} shown.</Status>

      <h2 className="sr-only">Latest uploads</h2>
      {visible.length ? (
        <div className="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
