import { useState } from 'react'
import { CalendarDaysIcon, CameraIcon, EnvelopeIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline'
import Artwork from '../components/Artwork.tsx'
import Avatar from '../components/Avatar.tsx'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import CreatePostDialog from '../components/CreatePostDialog.tsx'
import FollowButton from '../components/FollowButton.tsx'
import GlossaryText from '../components/GlossaryText.tsx'
import PageHeading from '../components/PageHeading.tsx'
import ProfileImageDialog from '../components/ProfileImageDialog.tsx'
import Status from '../components/Status.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { useT } from '../i18n/useT.tsx'
import { count, formatMonthYear } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function ProfilePage({ userId }: { userId: string }) {
  const t = useT()
  const { meId, findUser, getUploadsBy } = useData()
  const user = findUser(userId)
  const [creating, setCreating] = useState(false)
  const [changingPhoto, setChangingPhoto] = useState(false)
  const [changingBackground, setChangingBackground] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  if (!user) {
    return (
      <>
        <PageHeading title={t('title.profileNotFound')} />
        <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
          {t('profile.notFound')}{' '}
          <a href={paths.explore} className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
            {t('profile.explorePeople')}
          </a>
        </p>
      </>
    )
  }

  const own = user.id === meId
  const theirUploads = getUploadsBy(user.id)
  const stats = [
    { label: t('profile.uploads'), value: count(theirUploads.length) },
    { label: t('profile.followers'), value: count(user.followers) },
    { label: t('profile.following'), value: count(user.following) },
  ]

  return (
    <>
      <Breadcrumbs
        items={
          own
            ? [{ label: t('nav.home'), href: paths.home }, { label: t('profile.yourProfile') }]
            : [{ label: t('nav.home'), href: paths.home }, { label: t('nav.explore'), href: paths.explore }, { label: user.name }]
        }
      />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        {/* Decorative banner: no label, so it is hidden from assistive technology. */}
        {(() => {
          const banner = user.backgroundUrl ? (
            <img src={user.backgroundUrl} alt="" className="block h-40 w-full object-cover sm:h-56" />
          ) : (
            <Artwork seed={user.hue + 7} hue={user.hue} kind="photo" className="h-40 sm:h-56" />
          )
          if (!own) return banner
          return (
            <button
              type="button"
              onClick={() => {
                setAnnouncement('')
                setChangingBackground(true)
              }}
              aria-haspopup="dialog"
              className="group relative block w-full"
            >
              {banner}
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <CameraIcon className="size-8" />
              </span>
              <span className="sr-only">{t('profile.changeBackground')}</span>
            </button>
          )
        })()}

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
            {own ? (
              <button
                type="button"
                onClick={() => {
                  setAnnouncement('')
                  setChangingPhoto(true)
                }}
                aria-haspopup="dialog"
                className="group relative rounded-full"
              >
                <Avatar user={user} size="xl" className="ring-4 ring-surface" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <CameraIcon className="size-8" />
                </span>
                <span className="sr-only">{t('profile.changePhoto')}</span>
              </button>
            ) : (
              <Avatar user={user} size="xl" className="ring-4 ring-surface" />
            )}
            {!own && (
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <a
                  href={paths.messages(user.id)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2"
                >
                  <EnvelopeIcon className="size-4" aria-hidden="true" />
                  {t('profile.message')}
                  <span className="sr-only"> {user.name}</span>
                </a>
                <FollowButton user={user} />
              </div>
            )}
          </div>

          <h1 tabIndex={-1} className="mt-4 font-display text-3xl font-semibold tracking-tight">
            {user.name}
          </h1>
          <p className="text-muted">@{user.handle}</p>
          <p className="mt-4 max-w-prose leading-relaxed">
            <GlossaryText text={user.bio} />
          </p>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">{t('profile.location')}</span>
              <GlossaryText text={user.location} />
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              {t('profile.joined', { date: formatMonthYear(user.joined) })}
            </li>
          </ul>

          <ul aria-label={t('profile.interests')} className="mt-4 flex flex-wrap gap-1.5">
            {user.interests.map((interest) => (
              <li key={interest} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                {interest}
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mb-4 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{t('profile.uploads')}</h2>
        {own && (
          <button
            type="button"
            onClick={() => {
              setAnnouncement('')
              setCreating(true)
            }}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            {t('profile.createPost')}
          </button>
        )}
      </div>
      <Status>{announcement}</Status>
      {own && (
        <ProfileImageDialog
          which="avatar"
          open={changingPhoto}
          user={user}
          onClose={() => setChangingPhoto(false)}
          onSaved={(message) => {
            setChangingPhoto(false)
            setAnnouncement(message)
          }}
        />
      )}
      {own && (
        <ProfileImageDialog
          which="background"
          open={changingBackground}
          user={user}
          onClose={() => setChangingBackground(false)}
          onSaved={(message) => {
            setChangingBackground(false)
            setAnnouncement(message)
          }}
        />
      )}
      {own && (
        <CreatePostDialog
          open={creating}
          onClose={() => setCreating(false)}
          onSaved={(post) => {
            setCreating(false)
            setAnnouncement(t('post.published', { title: post.title }))
          }}
        />
      )}
      {theirUploads.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {theirUploads.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
          {t('profile.noUploads')}
        </p>
      )}
    </>
  )
}
