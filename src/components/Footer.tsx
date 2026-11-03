import { paths } from '../lib/router.ts'

/**
 * The help link sits in the same place on every page (WCAG 3.2.6 Consistent Help).
 */
export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 text-sm text-muted sm:px-6">
        <p>socia-med: a place to share creative work.</p>
        <nav aria-label="Help">
          <a href={paths.help} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink">
            Help and accessibility
          </a>
        </nav>
      </div>
    </footer>
  )
}
