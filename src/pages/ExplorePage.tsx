import Avatar from '../components/Avatar.tsx'
import FollowButton from '../components/FollowButton.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { uploads } from '../data/uploads.ts'
import { otherUsers } from '../data/users.ts'
import { compact } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

const trending = Object.entries(
  uploads
    .flatMap((u) => u.tags)
    .reduce<Record<string, number>>((acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }), {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 8)

export default function ExplorePage() {
  return (
    <>
      <PageHeading
        title="Explore"
        subtitle="People worth following and what they are making right now."
      />

      <section aria-labelledby="trending" className="mb-10">
        <h2 id="trending" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Trending tags
        </h2>
        <ul className="flex flex-wrap gap-2">
          {trending.map(([tag, count]) => (
            <li
              key={tag}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm"
            >
              #{tag} <span className="ml-1 tabular-nums text-muted">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="people">
        <h2 id="people" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          People to follow
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {otherUsers.map((user) => (
            <li
              key={user.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <Avatar user={user} size="lg" />
                <div className="min-w-0 leading-tight">
                  <a href={paths.profile(user.id)} className="block truncate font-display text-lg font-semibold hover:underline">
                    {user.name}
                  </a>
                  <p className="truncate text-sm text-muted">
                    @{user.handle} · {user.location}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{user.bio}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {user.interests.map((interest) => (
                  <li key={interest} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {interest}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-sm text-muted">
                  <span className="font-semibold text-ink">{compact(user.followers)}</span> followers
                </span>
                <FollowButton name={user.name} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
