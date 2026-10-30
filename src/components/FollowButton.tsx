import { useState } from 'react'

export default function FollowButton({ name }: { name: string }) {
  const [following, setFollowing] = useState(false)

  return (
    <button
      type="button"
      aria-pressed={following}
      aria-label={`Follow ${name}`}
      onClick={() => setFollowing((v) => !v)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium ${
        following
          ? 'border border-line bg-transparent text-ink hover:bg-surface-2'
          : 'bg-accent text-accent-ink hover:opacity-90'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
