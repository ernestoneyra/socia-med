import type { ReactNode } from 'react'
import Breadcrumbs from '../components/Breadcrumbs.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { glossary } from '../data/glossary.ts'
import type { MessageKey } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { paths } from '../lib/router.ts'

const issues = 'https://github.com/ernestoneyra/socia-med/issues'

const keys: { keys: MessageKey; does: MessageKey }[] = [
  { keys: 'help.keyTab', does: 'help.keyTabDoes' },
  { keys: 'help.keyEnter', does: 'help.keyEnterDoes' },
  { keys: 'help.keySpace', does: 'help.keySpaceDoes' },
  { keys: 'help.keyEscape', does: 'help.keyEscapeDoes' },
]

const lookAndFeel: MessageKey[] = [
  'help.look1',
  'help.look2',
  'help.look3',
  'help.look4',
  'help.look5',
  'help.look6',
  'help.look7',
]

const sections = glossary.filter((g) => g.kind === 'term')
const abbreviations = glossary.filter((g) => g.kind === 'abbreviation')

function Definitions({ entries }: { entries: typeof glossary }) {
  const t = useT()
  return (
    <dl className="space-y-4">
      {entries.map((g) => (
        <div key={g.id} className="max-w-prose">
          {/* The term is the word as it appears in posts, which stay in their own language. */}
          <dt className="font-semibold">{g.term}</dt>
          <dd className="text-muted">{t(g.definition)}</dd>
        </div>
      ))}
    </dl>
  )
}

const h2 = 'mb-3 mt-10 font-display text-2xl font-semibold'
const firstH2 = 'mb-3 font-display text-2xl font-semibold'
const linkClass = 'font-medium text-accent underline underline-offset-4 hover:text-accent-hover'

export default function HelpPage() {
  const t = useT()
  const bold = (text: string): ReactNode => <strong>{text}</strong>

  return (
    <>
      <Breadcrumbs items={[{ label: t('nav.home'), href: paths.home }, { label: t('title.help') }]} />
      <PageHeading title={t('title.help')} subtitle={t('help.subtitle')} />

      <div className="max-w-prose">
        <h2 className={firstH2}>{t('help.goalTitle')}</h2>
        <p>
          {t.rich('help.goalText', undefined, {
            a: (text) => (
              <a href={issues} className={linkClass}>
                {text}
              </a>
            ),
          })}
        </p>

        <h2 className={h2}>{t('help.aroundTitle')}</h2>
        <p>{t.rich('help.aroundText', undefined, { b: bold })}</p>
        <dl className="mt-4 space-y-3">
          {keys.map((k) => (
            <div key={k.keys}>
              <dt className="font-semibold">{t(k.keys)}</dt>
              <dd className="text-muted">{t(k.does)}</dd>
            </div>
          ))}
        </dl>

        <h2 className={h2}>{t('help.searchTitle')}</h2>
        <p>
          {t.rich('help.searchText', undefined, {
            a: (text) => (
              <a href={paths.explore} className={linkClass}>
                {text}
              </a>
            ),
          })}
        </p>
        <p>{t.rich('help.messagesText', undefined, { b: bold })}</p>

        <h2 className={h2}>{t('help.lookTitle')}</h2>
        <ul className="list-disc space-y-2 pl-6">
          {lookAndFeel.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>

        <h2 className={h2}>{t('help.languageTitle')}</h2>
        <p>{t('help.languageText')}</p>

        <h2 className={h2}>{t('help.limitsTitle')}</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t('help.limit1')}</li>
          <li>{t('help.limit2')}</li>
        </ul>
      </div>

      <h2 id="glossary" className={h2}>
        {t('help.glossaryTitle')}
      </h2>
      <p className="mb-6 max-w-prose text-muted">{t('help.glossaryIntro')}</p>
      <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        <section aria-labelledby="gl-terms">
          <h3 id="gl-terms" className="mb-4 text-lg font-semibold">
            {t('help.glossaryTerms')}
          </h3>
          <Definitions entries={sections} />
        </section>
        <section aria-labelledby="gl-abbr">
          <h3 id="gl-abbr" className="mb-4 text-lg font-semibold">
            {t('help.glossaryAbbreviations')}
          </h3>
          <Definitions entries={abbreviations} />
        </section>
      </div>
    </>
  )
}
