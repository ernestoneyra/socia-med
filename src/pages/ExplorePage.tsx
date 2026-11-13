import { useMemo, useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Avatar from '../components/Avatar.tsx'
import UploadCard from '../components/UploadCard.tsx'
import FollowButton from '../components/FollowButton.tsx'
import GlossaryText from '../components/GlossaryText.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import { useData } from '../data/store.ts'
import { m } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { count } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function ExplorePage() {
  const t = useT()
  const { uploads, otherUsers } = useData()
  const allTags = useMemo(
    () =>
      Object.entries(
        uploads
          .flatMap((u) => u.tags)
          .reduce<Record<string, number>>((acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }), {}),
      ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [uploads],
  )
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const posts = activeTag ? uploads.filter((u) => u.tags.includes(activeTag)) : uploads
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
        title={t('nav.explore')}
        subtitle={t('explore.subtitle')}
      />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-8">
        {/* The label repeats the placeholder, so the accessible name contains the visible text (SC 2.5.3). */}
        <label htmlFor="explore-search" className="sr-only">
          {t('explore.searchLabel')}
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
            placeholder={t('explore.searchLabel')}
            aria-describedby="explore-search-help"
            autoComplete="off"
            className="min-h-11 w-full rounded-full border border-edge bg-surface py-2.5 pl-11 pr-4 text-sm placeholder:text-muted focus-visible:outline-offset-0"
          />
        </div>
        {/* Context-sensitive help (SC 3.3.5). */}
        <p id="explore-search-help" className="mt-2 px-4 text-sm text-muted">
          {t('explore.searchHelp')}
        </p>
      </form>

      <Status>
        {activeTag
          ? t('explore.postsTaggedShown', { n: posts.length, tag: activeTag })
          : searching
            ? t('explore.matches', {
                people: m('count.people', { n: people.length }),
                tags: m('count.tags', { n: trending.length }),
                query: query.trim(),
              })
            : ''}
      </Status>

      <section aria-labelledby="trending" className="mb-10">
        <h2 id="trending" className="mb-3 text-lg font-semibold">
          {searching ? t('explore.matchingTags') : t('explore.trendingTags')}
        </h2>
        {trending.length === 0 && <p className="text-muted">{t('explore.noTags', { query: query.trim() })}</p>}
        <ul className="flex flex-wrap gap-2">
          {trending.map(([tag, uses]) => {
            const pressed = tag === activeTag
            return (
              <li key={tag}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setActiveTag(pressed ? null : tag)}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${
                    pressed
                      ? 'border-accent bg-accent font-medium text-accent-ink hover:opacity-90'
                      : 'border-edge bg-surface hover:border-accent hover:bg-surface-2'
                  }`}
                >
                  {/* A tick as well as a colour change, so the selection is not conveyed by colour alone (SC 1.4.1). */}
                  {pressed && <CheckIcon className="size-4" aria-hidden="true" />}#{tag}
                  <span className={pressed ? '' : 'text-muted'}>{t('count.uploads', { n: uses })}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="posts" className="mb-10">
        <h2 id="posts" className="mb-3 text-lg font-semibold">
          {activeTag ? t('explore.postsTagged', { tag: activeTag }) : t('explore.latestPosts')}
        </h2>
        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((upload) => (
              <UploadCard key={upload.id} upload={upload} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-edge px-6 py-16 text-center text-muted">
            {t('explore.noPosts', { tag: activeTag ?? '' })}
          </p>
        )}
      </section>

      <section aria-labelledby="people">
        <h2 id="people" className="mb-3 text-lg font-semibold">
          {searching ? t('explore.matchingPeople') : t('explore.peopleToFollow')}
        </h2>
        {people.length === 0 && <p className="text-muted">{t('explore.noPeople', { query: query.trim() })}</p>}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((user) => (
            <li
              key={user.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <Avatar user={user} size="lg" />
                <div className="min-w-0 break-words">
                  <h3 className="font-display text-lg font-semibold">
                    <a
                      href={paths.profile(user.id)}
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                    >
                      <span className="sr-only">{t('card.profileOf')}</span>
                      {user.name}
                    </a>
                  </h3>
                  <p className="text-sm text-muted">
                    @{user.handle} · {user.location}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                <GlossaryText text={user.bio} />
              </p>
              <ul aria-label={t('profile.interests')} className="mt-4 flex flex-wrap gap-1.5">
                {user.interests.map((interest) => (
                  <li key={interest} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {interest}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
                <span className="text-sm text-muted">
                  <span className="font-semibold text-ink">{count(user.followers)}</span> {t('menu.followers')}
                </span>
                <FollowButton user={user} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
