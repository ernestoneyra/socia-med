import { useState } from 'react'
import KindFilter, { type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { uploads } from '../data/uploads.ts'
import { me } from '../data/users.ts'

export default function HomePage() {
  const [kind, setKind] = useState<KindFilterValue>('all')
  const visible = kind === 'all' ? uploads : uploads.filter((u) => u.kind === kind)

  return (
    <>
      <PageHeading
        title={`Hello, ${me.name.split(' ')[0]}`}
        subtitle="Fresh work from the people you follow: photographs, recordings, rides and essays, newest first."
      />

      <KindFilter value={kind} onChange={setKind} />

      {visible.length ? (
        <div className="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
