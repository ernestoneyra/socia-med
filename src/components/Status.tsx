import type { ReactNode } from 'react'

/**
 * A polite live region for status messages (WCAG 4.1.3). Render it on first paint, empty,
 * and change its children later: screen readers announce changes, not regions that appear
 * with their text already inside.
 */
export default function Status({ children }: { children?: ReactNode }) {
  return (
    <div role="status" className="sr-only">
      {children}
    </div>
  )
}
