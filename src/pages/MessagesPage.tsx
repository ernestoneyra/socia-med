import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'
import Avatar from '../components/Avatar.tsx'
import PageHeading from '../components/PageHeading.tsx'
import { conversations as initial } from '../data/messages.ts'
import type { Conversation } from '../data/types.ts'
import { ME_ID, getUser } from '../data/users.ts'
import { ago, dayLabel, formatTime } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function MessagesPage({ activeId: requestedId }: { activeId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(initial)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // On wide screens something is always open; on phones no id means "show the list".
  const activeId = requestedId ?? conversations[0].userId
  const active = conversations.find((c) => c.userId === activeId)
  const other = active ? getUser(active.userId) : undefined

  useEffect(() => {
    // Scroll the thread itself; scrollIntoView would also move the page.
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, active?.messages.length])

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setConversations((list) =>
      list.map((c) =>
        c.userId === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: crypto.randomUUID(), from: ME_ID, text, sentAt: new Date().toISOString() },
              ],
            }
          : c,
      ),
    )
    setDraft('')
  }

  return (
    <>
      <PageHeading title="Messages" />
      <div className="grid h-[calc(100svh-14rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:grid-cols-[20rem_1fr]">
        {/* Conversation list */}
        <ul
          aria-label="Conversations"
          className={`overflow-y-auto border-line md:block md:border-r ${requestedId ? 'hidden' : 'block'}`}
        >
          {conversations.map((c) => {
            const user = getUser(c.userId)
            const last = c.messages[c.messages.length - 1]
            const selected = c.userId === activeId
            return (
              <li key={c.userId}>
                <a
                  href={paths.messages(c.userId)}
                  aria-current={selected ? 'true' : undefined}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 ${selected ? 'md:bg-surface-2' : ''}`}
                >
                  <Avatar user={user} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate ${c.unread ? 'font-semibold' : 'font-medium'}`}>{user.name}</span>
                      <span className="shrink-0 text-xs text-muted">{ago(last.sentAt)}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-sm ${c.unread ? 'text-ink' : 'text-muted'}`}>
                      {last.from === ME_ID && 'You: '}
                      {last.text}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold leading-5 text-accent-ink">
                      {c.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>

        {/* Thread */}
        {active && other ? (
          <section
            aria-label={`Conversation with ${other.name}`}
            className={`min-h-0 flex-col md:flex ${requestedId ? 'flex' : 'hidden'}`}
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <a href={paths.messages()} className="-ml-1 rounded-full p-1.5 hover:bg-surface-2 md:hidden" aria-label="Back to conversations">
                <ArrowLeftIcon className="size-5" aria-hidden="true" />
              </a>
              <Avatar user={other} size="sm" />
              <a href={paths.profile(other.id)} className="leading-tight hover:underline">
                <span className="block font-medium">{other.name}</span>
                <span className="block text-xs text-muted">@{other.handle}</span>
              </a>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {active.messages.map((m, i) => {
                const mine = m.from === ME_ID
                const prev = active.messages[i - 1]
                const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(m.sentAt)
                return (
                  <div key={m.id}>
                    {newDay && (
                      <p className="my-3 text-center text-xs font-medium text-muted">{dayLabel(m.sentAt)}</p>
                    )}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          mine ? 'rounded-br-md bg-accent text-accent-ink' : 'rounded-bl-md bg-surface-2'
                        }`}
                      >
                        <p>{m.text}</p>
                        <p className={`mt-0.5 text-[11px] tabular-nums ${mine ? 'opacity-75' : 'text-muted'}`}>
                          {formatTime(m.sentAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
              <label htmlFor="message-draft" className="sr-only">
                Message {other.name}
              </label>
              <input
                id="message-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Write to ${other.name.split(' ')[0]}…`}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm placeholder:text-muted focus-visible:outline-offset-0"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="grid size-9 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
              >
                <PaperAirplaneIcon className="size-4" aria-hidden="true" />
              </button>
            </form>
          </section>
        ) : (
          <p className="hidden place-items-center text-muted md:grid">Conversation not found.</p>
        )}
      </div>
    </>
  )
}
