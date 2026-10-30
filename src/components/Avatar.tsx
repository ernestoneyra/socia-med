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

export default function Avatar({ user, size = 'md', className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white select-none ${sizes[size]} ${className}`}
      style={{
        background: `linear-gradient(140deg, hsl(${user.hue} 62% 52%), hsl(${(user.hue + 40) % 360} 58% 34%))`,
      }}
    >
      {initials(user.name)}
    </span>
  )
}
