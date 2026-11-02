import { CalendarDaysIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Artwork from '../components/Artwork.tsx'
import Avatar from '../components/Avatar.tsx'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import FollowButton from '../components/FollowButton.tsx'
import GlossaryText from '../components/GlossaryText.tsx'
import PageHeading from '../components/PageHeading.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { useData } from '../data/store.ts'
import { count, formatMonthYear } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function ProfilePage({ userId }: { userId: string }) {
  const { meId, findUser, getUploadsBy } = useData()
  const user = findUser(userId)

  if (!user) {
    return (
      <>
        <PageHeading title="Profile not found" />
        <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
          We couldn’t find that profile.{' '}
          <a href={paths.explore} className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
            Explore people
          </a>
        </p>
      </>
    )
  }

  const own = user.id === meId
  const theirUploads = getUploadsBy(user.id)
  const stats = [
    { label: 'Uploads', value: count(theirUploads.length) },
    { label: 'Followers', value: count(user.followers) },
    { label: 'Following', value: count(user.following) },
  ]

  return (
    <>
      <Breadcrumbs
        items={
          own
            ? [{ label: 'Home', href: paths.home }, { label: 'Your profile' }]
            : [{ label: 'Home', href: paths.home }, { label: 'Explore', href: paths.explore }, { label: user.name }]
        }
      />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        {/* Decorative banner: no label, so it is hidden from assistive technology. */}
        <Artwork seed={user.hue + 7} hue={user.hue} kind="photo" className="h-40 sm:h-56" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
            <Avatar user={user} size="xl" className="ring-4 ring-surface" />
            {!own && (
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <a
                  href={paths.messages(user.id)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-edge px-5 text-sm font-medium hover:bg-surface-2"
                >
                  <EnvelopeIcon className="size-4" aria-hidden="true" />
                  Message<span className="sr-only"> {user.name}</span>
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
              <span className="sr-only">Location: </span>
              <GlossaryText text={user.location} />
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              Joined {formatMonthYear(user.joined)}
            </li>
          </ul>

          <ul aria-label="Interests" className="mt-4 flex flex-wrap gap-1.5">
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

      <h2 className="mb-4 mt-10 font-display text-2xl font-semibold">Uploads</h2>
      {theirUploads.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {theirUploads.map((upload) => (
            <UploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
          No uploads yet.
        </p>
      )}
    </>
  )
}
