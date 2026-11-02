import { CheckIcon } from '@heroicons/react/20/solid'
import { setFollowing } from '../data/social.ts'
import type { User } from '../data/types.ts'

/**
 * The state is spelled out in the visible text, and the person's name is appended for
 * screen readers, so the accessible name contains the visible label (WCAG 2.5.3).
 * Following is a toggle: pressing the button again undoes it. It is saved to the server.
 */
export default function FollowButton({ user }: { user: User }) {
  const following = user.followedByMe

  return (
    <button
      type="button"
      onClick={() => setFollowing(user.id, !following)}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium ${
        following
          ? 'border border-edge bg-transparent text-ink hover:bg-surface-2'
          : 'border border-transparent bg-accent text-accent-ink hover:bg-accent-hover'
      }`}
    >
      {following && <CheckIcon className="size-4" aria-hidden="true" />}
      {following ? 'Following' : 'Follow'}
      <span className="sr-only"> {user.name}</span>
    </button>
  )
}
