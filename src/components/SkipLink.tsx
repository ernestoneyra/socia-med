import { useT } from '../i18n/useT.tsx'

const MAIN_ID = 'main-content'

/**
 * First focusable element on every page (WCAG 2.4.1). The router is hash-based, so a plain
 * "#main-content" anchor would be read as a route change; we move focus ourselves instead.
 */
export default function SkipLink() {
  const t = useT()
  return (
    <a
      href={`#${MAIN_ID}`}
      onClick={(e) => {
        e.preventDefault()
        const main = document.getElementById(MAIN_ID)
        main?.focus()
        main?.scrollIntoView()
      }}
      className="sr-only rounded-lg bg-accent px-5 py-3 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
    >
      {t('skip.toMain')}
    </a>
  )
}
