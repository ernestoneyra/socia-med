import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children?: ReactNode
}

export default function PageHeading({ title, subtitle, children }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {/* tabIndex -1: the app moves focus here after navigation so screen readers announce the new page. */}
        <h1 tabIndex={-1} className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-prose text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
