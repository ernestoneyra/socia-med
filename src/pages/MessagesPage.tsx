import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'
import Avatar from '../components/Avatar.tsx'
import NewConversation from '../components/NewConversation.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import { markConversationRead, sendMessage, unsendMessage, useInbox } from '../data/inbox.ts'
import { useData } from '../data/store.ts'
import { useT } from '../i18n/useT.tsx'
import { ago, dayLabel, formatTime } from '../lib/format.ts'
import { paths } from '../lib/router.ts'

export default function MessagesPage({ activeId: requestedId }: { activeId?: string }) {
  const t = useT()
  const { meId, getUser, findUser } = useData()
  const { conversations } = useInbox()
  // One draft per conversation, so text typed for one person is never sent to another.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [lastSent, setLastSent] = useState<{ userId: string; id: string; text: string } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // On wide screens something is always open; on phones no id means "show the list".
  const activeId = requestedId ?? conversations[0]?.userId ?? ''
  const existing = conversations.find((c) => c.userId === activeId)
  // Opening someone you have not written to yet (from New message, or a profile) shows an empty
  // thread. The conversation itself is created when the first message is sent.
  const newcomer = !existing && requestedId && requestedId !== meId ? findUser(requestedId) : undefined
  const active = existing ?? (newcomer ? { userId: newcomer.id, unread: 0, messages: [] } : undefined)
  const other = active ? getUser(active.userId) : undefined
  const isNewThread = !!requestedId && !!active && active.messages.length === 0
  const draft = drafts[activeId] ?? ''
  const setDraft = (text: string) => setDrafts((d) => ({ ...d, [activeId]: text }))

  // Sending is reversible (WCAG 3.3.6): the last message you sent can be taken back, with no time limit.
  const canUndo =
    lastSent?.userId === activeId && !!active?.messages.some((m) => m.id === lastSent.id)

  useEffect(() => {
    // Scroll the thread itself; scrollIntoView would also move the page.
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, active?.messages.length])

  // Viewing a thread reads it. On phones the list is shown until a thread is chosen,
  // so only the wide layout counts the default conversation as seen.
  useEffect(() => {
    if (!existing) return
    if (requestedId || window.matchMedia('(min-width: 768px)').matches) markConversationRead(existing.userId)
  }, [existing, requestedId])

  // An empty thread has one thing to do, so the keyboard starts in the message box.
  useEffect(() => {
    if (isNewThread) inputRef.current?.focus()
  }, [isNewThread, activeId])

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !other) return
    const id = sendMessage(activeId, text)
    setLastSent({ userId: activeId, id, text })
    setDraft('')
    setAnnouncement(t('messages.sentTo', { name: other.name }))
  }

  function undo() {
    if (!lastSent || !other) return
    unsendMessage(lastSent.userId, lastSent.id)
    setDrafts((d) => ({ ...d, [lastSent.userId]: lastSent.text }))
    setLastSent(null)
    setAnnouncement(t('messages.unsent'))
    inputRef.current?.focus()
  }

  return (
    <>
      <PageHeading title={t('nav.messages')} />
      <Status>{announcement}</Status>
      <div className="grid h-[calc(100svh-14rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:grid-cols-[20rem_1fr]">
        {/* Conversation list */}
        <div className={`min-h-0 overflow-y-auto border-line md:block md:border-r ${requestedId ? 'hidden' : 'block'}`}>
          <NewConversation />
          <h2 className="sr-only">{t('messages.conversations')}</h2>
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-muted">{t('messages.empty')}</p>
          )}
          <ul>
            {conversations.map((c) => {
              const user = getUser(c.userId)
              const last = c.messages[c.messages.length - 1]
              const selected = c.userId === activeId
              return (
                <li key={c.userId}>
                  <a
                    href={paths.messages(c.userId)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex min-h-11 items-center gap-3 px-4 py-3.5 hover:bg-surface-2 focus-visible:-outline-offset-4 ${selected ? 'md:bg-surface-2' : ''}`}
                  >
                    <Avatar user={user} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className={`break-words ${c.unread ? 'font-semibold' : 'font-medium'}`}>
                          <span className="sr-only">{t('messages.conversationWith')}</span>
                          {user.name}
                        </span>
                        {last && (
                          <time dateTime={last.sentAt} className="shrink-0 text-xs text-muted">
                            {ago(last.sentAt)}
                          </time>
                        )}
                      </span>
                      {/* A one-line preview; the whole message is in the thread. */}
                      <span className={`mt-0.5 block truncate text-sm ${c.unread ? 'text-ink' : 'text-muted'}`}>
                        {last?.from === meId && t('messages.you')}
                        {last?.text}
                      </span>
                    </span>
                    {c.unread > 0 && (
                      <span className="fc-border grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">
                        {c.unread}
                        <span className="sr-only">{t('count.unreadMessages', { n: c.unread })}</span>
                      </span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Thread */}
        {active && other ? (
          <section
            aria-labelledby="thread-title"
            className={`min-h-0 flex-col md:flex ${requestedId ? 'flex' : 'hidden'}`}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <a
                href={paths.messages()}
                className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-2 md:hidden"
                aria-label={t('messages.back')}
              >
                <ArrowLeftIcon className="size-5" aria-hidden="true" />
              </a>
              <Avatar user={other} size="sm" />
              <h2 id="thread-title" className="min-w-0 break-words">
                <a
                  href={paths.profile(other.id)}
                  className="inline-flex min-h-11 flex-col justify-center hover:underline"
                >
                  <span className="font-medium">
                    <span className="sr-only">{t('messages.conversationWith')}</span>
                    {other.name}
                  </span>
                  <span className="text-sm font-normal text-muted">
                    @{other.handle}
                    <span className="sr-only">{t('messages.opensProfile')}</span>
                  </span>
                </a>
              </h2>
            </div>

            <div
              ref={scrollRef}
              role="region"
              aria-label={t('messages.history', { name: other.name })}
              // A scrolling area with nothing focusable inside must itself be reachable by keyboard (SC 2.1.1).
              tabIndex={0}
              className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
            >
              {active.messages.length === 0 && (
                <p className="py-6 text-center text-muted">
                  {t('messages.noneYet', { name: other.name.split(' ')[0] })}
                </p>
              )}
              {active.messages.map((m, i) => {
                const mine = m.from === meId
                const prev = active.messages[i - 1]
                const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(m.sentAt)
                return (
                  <div key={m.id}>
                    {newDay && <p className="my-3 text-center text-sm font-medium text-muted">{dayLabel(m.sentAt)}</p>}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[min(80%,70ch)] rounded-2xl px-4 py-2 text-sm ${
                          mine ? 'rounded-br-md bg-accent text-accent-ink' : 'rounded-bl-md bg-surface-2'
                        }`}
                      >
                        {/* Who said it is spelled out, so it does not depend on side or colour (SC 1.3.3, 1.4.1). */}
                        <p className="break-words">
                          <span className="sr-only">{mine ? t('messages.youSaid') : t('messages.saidPrefix', { name: other.name })}</span>
                          {m.text}
                        </p>
                        <time dateTime={m.sentAt} className={`mt-0.5 block text-xs tabular-nums ${mine ? '' : 'text-muted'}`}>
                          {formatTime(m.sentAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={send} className="border-t border-line p-3">
              {canUndo && (
                <p className="mb-2 flex flex-wrap items-center gap-x-3 text-sm">
                  <span>{t('messages.sent')}</span>
                  <button
                    type="button"
                    onClick={undo}
                    className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
                  >
                    {t('messages.undo')}
                  </button>
                </p>
              )}
              <div className="flex items-center gap-2">
                {/* The label repeats the placeholder, so the accessible name contains the visible text (SC 2.5.3). */}
                <label htmlFor="message-draft" className="sr-only">
                  {t('messages.writeTo', { name: other.name })}
                </label>
                <input
                  id="message-draft"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('messages.writeTo', { name: other.name.split(' ')[0] })}
                  aria-describedby="message-help"
                  autoComplete="off"
                  className="min-h-11 min-w-0 flex-1 rounded-full border border-edge bg-paper px-4 py-2 text-sm placeholder:text-muted focus-visible:outline-offset-0"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label={t('messages.send')}
                  className="fc-border grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted"
                >
                  <PaperAirplaneIcon className="size-5" aria-hidden="true" />
                </button>
              </div>
              {/* Context-sensitive help (SC 3.3.5). */}
              <p id="message-help" className="mt-2 px-2 text-sm text-muted">
                {t('messages.help')}
              </p>
            </form>
          </section>
        ) : (
          <p className="hidden place-items-center px-6 text-center text-muted md:grid">
            {requestedId ? t('messages.notFound') : t('messages.choose')}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">
        {t('messages.marksRead')}
      </p>
    </>
  )
}
