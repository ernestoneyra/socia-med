import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import KindFilter, { filterByKinds, type KindFilterValue } from '../components/KindFilter.tsx'
import PageHeading from '../components/PageHeading.tsx'
import ShrugIcon from '../components/ShrugIcon.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { useT } from '../i18n/useT.tsx'
import { paths } from '../lib/router.ts'

export default function UploadsPage({ userId }: { userId?: string }) {
  const t = useT()
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
            { label: t('nav.home'), href: paths.home },
            { label: t('nav.uploads'), href: paths.uploads() },
            { label: owner.name },
          ]}
        />
      )}
      <PageHeading
        title={owner ? t('title.uploadsBy', { name: owner.name }) : t('nav.uploads')}
        subtitle={t('count.uploadsTotal', { n: scoped.length })}
      />

      <KindFilter value={kinds} onChange={setKinds} />
      <Status>{t('count.uploadsShown', { n: visible.length })}</Status>

      <h2 className="sr-only">{t('uploads.list')}</h2>
      {visible.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center text-muted">
          <ShrugIcon className="size-24" />
          <p>{t('home.empty')}</p>
        </div>
      )}
    </>
  )
}
