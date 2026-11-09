import { useState } from 'react'
import KindFilter, { filterByKinds, type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import ShrugIcon from '../components/ShrugIcon.tsx'
import SortFilter from '../components/SortFilter.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { plural } from '../lib/format.ts'
import { sortByDate, type SortValue } from '../lib/sort.ts'

export default function HomePage() {
  const { me, uploads } = useData()
  const [kinds, setKinds] = useState<KindFilterValue>([])
  const [sort, setSort] = useState<SortValue>('latest')
  // The home feed is other people's work; your own posts live on the Uploads page.
  const visible = sortByDate(
    filterByKinds(
      uploads.filter((u) => u.userId !== me.id),
      kinds,
    ),
    sort,
  )

  return (
    <>
      <PageHeading
        title={`Hello, ${me.name.split(' ')[0]}`}
        subtitle="Fresh work from the people you follow: photographs, recordings, rides and essays, newest first."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <KindFilter value={kinds} onChange={setKinds} className="" />
        <SortFilter value={sort} onChange={setSort} />
      </div>
      <Status>{plural(visible.length, 'upload')} shown.</Status>

      <h2 className="sr-only">Latest uploads</h2>
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
