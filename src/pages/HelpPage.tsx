import Breadcrumbs from '../components/Breadcrumbs.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { glossary } from '../data/glossary.ts'
import { paths } from '../lib/router.ts'

const issues = 'https://github.com/ernestoneyra/socia-med/issues'

const keys: { keys: string; does: string }[] = [
  { keys: 'Tab and Shift + Tab', does: 'Move forward and back through links, buttons and fields.' },
  { keys: 'Enter', does: 'Open a link, press a button, or send a message.' },
  { keys: 'Space', does: 'Press a button or switch.' },
  { keys: 'Escape', does: 'Close the account menu and return to its button.' },
]

const sections = glossary.filter((g) => g.kind === 'term')
const abbreviations = glossary.filter((g) => g.kind === 'abbreviation')

function Definitions({ entries }: { entries: typeof glossary }) {
  return (
    <dl className="space-y-4">
      {entries.map((g) => (
        <div key={g.id} className="max-w-prose">
          <dt className="font-semibold">{g.term}</dt>
          <dd className="text-muted">{g.definition}</dd>
        </div>
      ))}
    </dl>
  )
}

const h2 = 'mb-3 mt-10 font-display text-2xl font-semibold'
const firstH2 = 'mb-3 font-display text-2xl font-semibold'

export default function HelpPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', href: paths.home }, { label: 'Help and accessibility' }]} />
      <PageHeading
        title="Help and accessibility"
        subtitle="How to get around socia-med, how we make it usable for everyone, and what the unusual words mean."
      />

      <div className="max-w-prose">
        <h2 className={firstH2}>Our goal</h2>
        <p>
          socia-med aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AAA. Where a rule has no
          AAA level, we meet the next level down. If something here does not work for you, please{' '}
          <a href={issues} className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
            tell us on GitHub
          </a>
          . Describe the page, what you used and what went wrong.
        </p>

        <h2 className={h2}>Getting around</h2>
        <p>
          The first link on every page is <strong>Skip to main content</strong>. It appears when you press Tab. After you
          open a page, the page title is read out and you start at the top of the new page.
        </p>
        <dl className="mt-4 space-y-3">
          {keys.map((k) => (
            <div key={k.keys}>
              <dt className="font-semibold">{k.keys}</dt>
              <dd className="text-muted">{k.does}</dd>
            </div>
          ))}
        </dl>

        <h2 className={h2}>Search and messages</h2>
        <p>
          On <a href={paths.explore} className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">Explore</a>,
          type in the search box and the lists change as you type. A short message tells screen readers how many results
          there are.
        </p>
        <p>
          In Messages, a conversation opens when you choose it, and each conversation keeps its own unsent text. After you
          send a message, an <strong>Undo send</strong> button stays available until you send another.
        </p>

        <h2 className={h2}>Look and feel</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Text has a contrast ratio of at least 7 to 1 in both the light and the dark theme.</li>
          <li>Use the Dark mode switch in the header to change theme. It follows your device setting until you choose.</li>
          <li>Animation stops if your device asks for reduced motion.</li>
          <li>Everything works at 200 per cent zoom and on a narrow screen, without sideways scrolling.</li>
          <li>Buttons and links are at least 44 by 44 pixels, except links inside a sentence.</li>
          <li>Nothing changes or disappears on a timer. You decide when a notification counts as read.</li>
          <li>Your own browser colours and Windows high contrast mode are respected.</li>
        </ul>

        <h2 className={h2}>Known limits</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Pictures, audio and video in this version are generated stand-ins. When real uploads arrive, each one needs a
            written description, and audio and video need captions, a transcript, audio description and a sign language
            version.
          </li>
          <li>
            Text written by other people, such as captions and messages, is not rewritten. We explain the unusual words we
            know about below.
          </li>
        </ul>
      </div>

      <h2 id="glossary" className={h2}>
        Glossary
      </h2>
      <p className="mb-6 max-w-prose text-muted">
        In captions and profiles, an underlined word with a dotted line opens its meaning when you select it. Here is the
        full list.
      </p>
      <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        <section aria-labelledby="gl-terms">
          <h3 id="gl-terms" className="mb-4 text-lg font-semibold">
            Words and phrases
          </h3>
          <Definitions entries={sections} />
        </section>
        <section aria-labelledby="gl-abbr">
          <h3 id="gl-abbr" className="mb-4 text-lg font-semibold">
            Abbreviations
          </h3>
          <Definitions entries={abbreviations} />
        </section>
      </div>
    </>
  )
}
