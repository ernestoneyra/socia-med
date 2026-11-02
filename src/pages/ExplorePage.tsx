import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Avatar from '../components/Avatar.tsx'
import FollowButton from '../components/FollowButton.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { uploads } from '../data/uploads.ts'
import { otherUsers } from '../data/users.ts'
import { compact } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

const allTags = Object.entries(
  uploads
    .flatMap((u) => u.tags)
    .reduce<Record<string, number>>((acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }), {}),
).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase().replace(/^[#@]/, '')
  const searching = q.length > 0

  const trending = (searching ? allTags.filter(([tag]) => tag.toLowerCase().includes(q)) : allTags).slice(0, 8)
  const people = searching
    ? otherUsers.filter((u) =>
        [u.name, u.handle, u.bio, u.location, ...u.interests].some((field) =>
          field.toLowerCase().includes(q),
        ),
      )
    : otherUsers

  return (
    <>
      <PageHeading
        title="Explore"
        subtitle="People worth following and what they are making right now."
      />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-8">
        <label htmlFor="explore-search" className="sr-only">
          Search people and tags
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="explore-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, interests and tags…"
            autoComplete="off"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-4 text-sm placeholder:text-muted focus-visible:outline-offset-0"
          />
        </div>
      </form>

      <section aria-labelledby="trending" className="mb-10">
        <h2 id="trending" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          {searching ? 'Matching tags' : 'Trending tags'}
        </h2>
        {trending.length === 0 && <p className="text-sm text-muted">No tags match “{query.trim()}”.</p>}
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
          {searching ? 'Matching people' : 'People to follow'}
        </h2>
        {people.length === 0 && <p className="text-sm text-muted">No people match “{query.trim()}”.</p>}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((user) => (
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
