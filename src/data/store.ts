import { useSyncExternalStore } from 'react'
import { fetchSnapshot, type Snapshot } from './api.ts'
import type { Upload, User } from './types.ts'

/**
 * The app's data lives in MongoDB. This store holds the latest copy the server sent,
 * re-reads it whenever the tab regains focus (so edits made directly in the database
 * show up), and applies the person's own changes optimistically before the server confirms.
 */

/** What the server owns; everything else in `Data` is derived from it. */
export type Core = Snapshot

export interface Data extends Core {
  /** The signed-in user. */
  me: User
  otherUsers: User[]
  findUser(id: string): User | undefined
  /** For ids that must exist, such as the author of an upload. */
  getUser(id: string): User
  getUpload(id: string): Upload | undefined
  getUploadsBy(userId: string): Upload[]
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Data }

function build(core: Core): Data {
  const byId = new Map(core.users.map((u) => [u.id, u]))
  const me = byId.get(core.meId)
  if (!me) throw new Error(`The signed-in user "${core.meId}" is not in the database.`)

  // The database can be edited by hand, so ignore rows that point at people who do not exist.
  const uploads = core.uploads.filter((u) => byId.has(u.userId))
  const uploadsById = new Map(uploads.map((u) => [u.id, u]))

  return {
    ...core,
    uploads,
    conversations: core.conversations.filter((c) => byId.has(c.userId)),
    notifications: core.notifications.filter((n) => byId.has(n.actorId)),
    me,
    otherUsers: core.users.filter((u) => u.id !== me.id),
    findUser: (id) => byId.get(id),
    getUser(id) {
      const user = byId.get(id)
      if (!user) throw new Error(`Unknown user: ${id}`)
      return user
    },
    getUpload: (id) => uploadsById.get(id),
    getUploadsBy: (userId) => uploads.filter((u) => u.userId === userId),
  }
}

let state: State = { status: 'loading' }
const listeners = new Set<() => void>()

function setState(next: State) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useDataState(): State {
  return useSyncExternalStore(subscribe, () => state)
}

/** For components rendered only once the data has loaded (App gates on this). */
export function useData(): Data {
  const current = useDataState()
  if (current.status !== 'ready') throw new Error('useData was used before the data finished loading.')
  return current.data
}

// --- Loading -------------------------------------------------------------------------------

let requestCounter = 0
/** Bumped by every local change, so a read that started before a change cannot undo it. */
let writeVersion = 0
let pendingWrites = 0
let writeQueue: Promise<unknown> = Promise.resolve()

export async function loadData(): Promise<void> {
  const requestId = ++requestCounter
  const startedAt = writeVersion
  try {
    const data = build(await fetchSnapshot())
    // Only the newest read counts, and only if nothing was changed locally while it was in flight.
    if (requestId !== requestCounter || pendingWrites > 0 || writeVersion !== startedAt) return
    setState({ status: 'ready', data })
  } catch (err) {
    if (state.status === 'ready') {
      console.warn('Could not refresh the data; showing the last copy.', err)
    } else if (requestId === requestCounter) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }
}

export function retryLoad() {
  setState({ status: 'loading' })
  return loadData()
}

/** Re-reads the data when the person returns to the tab. Returns a function that stops it. */
export function startAutoRefresh(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void loadData()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onVisible)
  }
}

// --- Changes -------------------------------------------------------------------------------

/** Applies a change to the local copy straight away. */
export function updateData(change: (core: Core) => Core) {
  if (state.status !== 'ready') return
  writeVersion++
  setState({ status: 'ready', data: build(change(state.data)) })
}

/**
 * Sends a change to the server. If it fails, the local copy is replaced by what the
 * server has, so the screen never keeps showing something that was not saved.
 */
export async function persist<T>(write: () => Promise<T>): Promise<T | undefined> {
  pendingWrites++
  writeVersion++
  let result: T | undefined
  let failed = false
  // One at a time, in the order they were made: pressing Like and then Unlike quickly
  // must not reach the server the other way round.
  const run = writeQueue.then(write)
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  )
  try {
    result = await run
  } catch (err) {
    console.error('Could not save the change.', err)
    failed = true
  }
  pendingWrites--
  writeVersion++
  if (failed) void loadData()
  return result
}
