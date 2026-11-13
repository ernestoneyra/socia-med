import { useT } from '../i18n/useT.tsx'

export interface Crumb {
  label: string
  /** Omit for the current page. */
  href?: string
}

/** Shows where the page sits in the site (WCAG 2.4.8 Location). The last crumb is the current page. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useT()
  return (
    <nav aria-label={t('nav.breadcrumb')} className="mb-4">
      <ol className="flex flex-wrap items-center text-sm text-muted">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-1">
                /
              </span>
            )}
            {item.href ? (
              <a href={item.href} className="inline-flex min-h-11 items-center px-1 underline underline-offset-4 hover:text-ink">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="px-1 font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
