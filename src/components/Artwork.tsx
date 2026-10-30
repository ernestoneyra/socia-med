import { useId } from 'react'
import type { UploadKind } from '../data/types.ts'

interface Props {
  seed: number
  hue: number
  kind: UploadKind
  className?: string
}

// Small deterministic PRNG so the same upload always renders the same picture.
function rng(seed: number) {
  let a = seed * 2654435761
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hsl = (h: number, s: number, l: number, a = 1) => `hsl(${h % 360} ${s}% ${l}% / ${a})`

/** Generated stand-in for a real upload. 4:3 viewBox, scales to fill its container. */
export default function Artwork({ seed, hue, kind, className = '' }: Props) {
  const id = useId()
  const r = rng(seed)
  const h2 = hue + 30 + Math.round(r() * 50)

  let body
  if (kind === 'audio') {
    const bars = Array.from({ length: 36 }, () => 20 + r() * 150)
    body = (
      <>
        <rect width="400" height="300" fill={`url(#${id})`} />
        {bars.map((h, i) => (
          <rect
            key={i}
            x={26 + i * 10}
            y={150 - h / 2}
            width="5"
            height={h}
            rx="2.5"
            fill={hsl(hue, 80, 92, i % 7 === 0 ? 1 : 0.7)}
          />
        ))}
      </>
    )
  } else if (kind === 'writing') {
    const lines = Array.from({ length: 7 }, () => 150 + r() * 160)
    body = (
      <>
        <rect width="400" height="300" fill={hsl(hue, 35, 92)} />
        <rect x="46" y="44" width={90 + r() * 70} height="14" rx="3" fill={hsl(hue, 60, 38)} />
        {lines.map((w, i) => (
          <rect
            key={i}
            x="46"
            y={86 + i * 24}
            width={Math.min(w, 308)}
            height="7"
            rx="3.5"
            fill={hsl(hue, 20, 58, 0.55)}
          />
        ))}
        <circle cx={340} cy={52} r="16" fill={hsl(h2, 70, 55, 0.85)} />
      </>
    )
  } else {
    // photo + video: a layered landscape, video gets a play button on top.
    const sunX = 70 + r() * 260
    const sunY = 70 + r() * 70
    // A smooth ridge line: two cubic curves meeting at x=200, then closed along the bottom.
    const ridge = (base: number, amp: number, fill: string) => {
      const y = () => Math.round(base - r() * amp)
      const d =
        `M0,300 L0,${y()} C60,${y()} 120,${y()} 200,${y()} ` +
        `S340,${y()} 400,${y()} L400,300 Z`
      return <path d={d} fill={fill} />
    }
    body = (
      <>
        <rect width="400" height="300" fill={`url(#${id})`} />
        <circle cx={sunX} cy={sunY} r={28 + r() * 22} fill={hsl(hue + 20, 95, 88, 0.9)} />
        {ridge(190, 70, hsl(h2, 45, 42, 0.8))}
        {ridge(230, 55, hsl(hue, 40, 26, 0.9))}
        {ridge(270, 30, hsl(h2, 35, 15))}
        {kind === 'video' && (
          <g>
            <circle cx="200" cy="150" r="32" fill="rgb(0 0 0 / 0.45)" />
            <path d="M190 134 L219 150 L190 166 Z" fill="white" />
          </g>
        )}
      </>
    )
  }

  const dark = kind === 'audio'
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${kind} upload artwork`}
      className={`block w-full ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={dark ? hsl(hue, 55, 28) : hsl(hue, 80, 70)} />
          <stop offset="1" stopColor={dark ? hsl(h2, 60, 14) : hsl(h2, 75, 55)} />
        </linearGradient>
      </defs>
      {body}
    </svg>
  )
}
