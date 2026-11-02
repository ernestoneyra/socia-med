import type { User } from '../data/types.ts'

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-28 text-4xl',
} as const

interface Props {
  user: Pick<User, 'name' | 'hue'>
  size?: keyof typeof sizes
  className?: string
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Decorative: the person's name always appears next to it. The initials are generated content
 * (not text), so they are not read out and never have to be part of an accessible name (SC 2.5.3).
 * Both gradient stops are dark enough for white initials to reach 7:1 at every hue (SC 1.4.6).
 */
export default function Avatar({ user, size = 'md', className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      data-initials={initials(user.name)}
      className={`fc-border inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white select-none before:content-[attr(data-initials)] ${sizes[size]} ${className}`}
      style={{
        background: `linear-gradient(140deg, hsl(${user.hue} 62% 22%), hsl(${(user.hue + 40) % 360} 58% 15%))`,
      }}
    />
  )
}
