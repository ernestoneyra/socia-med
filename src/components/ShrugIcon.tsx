import type { SVGProps } from 'react'

// One hand, drawn once and mirrored for the other side: a mitten with the thumb out, palm open.
const hand = (
  <>
    <path d="M-3.2 0V-5.4a3.2 3.2 0 0 1 6.4 0V0Z" fill="currentColor" />
    <path d="M-2.6-1.6L-4.9-4.4" strokeWidth={3} />
  </>
)

/**
 * A person shrugging, hands raised halfway with the palms open: "I don't know".
 * Drawn on a 64 x 64 grid in currentColor, so it takes the colour of the text around it in
 * both themes. Decorative: it is hidden from assistive technology, so say the same thing in text.
 */
export default function ShrugIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Head, with a slightly tilted, unsure face. */}
      <circle cx="32" cy="16" r="6.5" />
      <g transform="rotate(-9 32 16)">
        <circle cx="29.6" cy="15.2" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="34.4" cy="15.2" r="1.4" fill="currentColor" stroke="none" />
        <path d="M29.9 19h4.2" strokeWidth={1.7} />
      </g>
      {/* Torso, shoulders up. */}
      <path d="M22 38C22 31.5 26.5 28 32 28s10 3.5 10 10v14a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4Z" />
      {/* Arms: elbows down and out, forearms raised, a hand on the end of each. */}
      <path d="M22 38 13 48.5 9.5 40" />
      <path d="M42 38l9 10.5 3.5-8.5" />
      <g transform="translate(9.5 40) rotate(-14)">{hand}</g>
      <g transform="translate(54.5 40) scale(-1 1) rotate(-14)">{hand}</g>
    </svg>
  )
}
