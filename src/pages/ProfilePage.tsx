import { CalendarDaysIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Artwork from '../components/Artwork.tsx'
import Avatar from '../components/Avatar.tsx'
import FollowButton from '../components/FollowButton.tsx'
import UploadCard from '../components/UploadCard.tsx'
import { getUploadsBy } from '../data/uploads.ts'
import { ME_ID, findUser } from '../data/users.ts'
import { compact, formatMonthYear } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function ProfilePage({ userId }: { userId: string }) {
  const user = findUser(userId)

  if (!user) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
        We couldn’t find that profile. <a href={paths.explore} className="text-accent underline">Explore people</a>
      </p>
    )
  }

  const own = user.id === ME_ID
  const theirUploads = getUploadsBy(user.id)
  const stats = [
    { label: 'Uploads', value: theirUploads.length },
    { label: 'Followers', value: compact(user.followers) },
    { label: 'Following', value: compact(user.following) },
  ]

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <Artwork seed={user.hue + 7} hue={user.hue} kind="photo" className="h-40 sm:h-56" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
            <Avatar user={user} size="xl" className="ring-4 ring-surface" />
            {!own && (
              <div className="flex items-center gap-2 pb-1">
                <a
                  href={paths.messages(user.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:bg-surface-2"
                >
                  <EnvelopeIcon className="size-4" aria-hidden="true" />
                  Message
                </a>
                <FollowButton name={user.name} />
              </div>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-muted">@{user.handle}</p>
          <p className="mt-4 max-w-prose leading-relaxed">{user.bio}</p>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" aria-hidden="true" />
              {user.location}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              Joined {formatMonthYear(user.joined)}
            </li>
          </ul>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {user.interests.map((interest) => (
              <li key={interest} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                {interest}
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex gap-8 border-t border-line pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-wider text-muted">{s.label}</dt>
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
        <p className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
          No uploads yet.
        </p>
      )}
    </>
  )
}
