import { useSyncExternalStore } from 'react'
import { conversations as seedConversations, notifications as seedNotifications } from './messages.ts'
import type { Conversation, Notification } from './types.ts'
import { ME_ID } from './users.ts'

/**
 * Shared, reactive inbox state. The header badges, the conversation list and the
 * notifications page all read from here, so marking something as seen updates
 * every tag at once.
 */
interface Inbox {
  conversations: Conversation[]
  notifications: Notification[]
}

let state: Inbox = { conversations: seedConversations, notifications: seedNotifications }
const listeners = new Set<() => void>()

function set(next: Inbox) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const getState = () => state

export function useInbox(): Inbox {
  return useSyncExternalStore(subscribe, getState)
}

export function unreadMessageCount(list: Conversation[]): number {
  return list.reduce((sum, c) => sum + c.unread, 0)
}

export function unreadNotificationCount(list: Notification[]): number {
  return list.filter((n) => !n.read).length
}

/** Opening a conversation reads it, and the "new message" notifications that pointed at it. */
export function markConversationRead(userId: string) {
  const hasUnread =
    state.conversations.some((c) => c.userId === userId && c.unread > 0) ||
    state.notifications.some((n) => n.type === 'message' && n.actorId === userId && !n.read)
  if (!hasUnread) return
  set({
    conversations: state.conversations.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c)),
    notifications: state.notifications.map((n) =>
      n.type === 'message' && n.actorId === userId ? { ...n, read: true } : n,
    ),
  })
}

export function markNotificationRead(id: string) {
  if (!state.notifications.some((n) => n.id === id && !n.read)) return
  set({
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  })
}

export function markAllNotificationsRead() {
  if (!state.notifications.some((n) => !n.read)) return
  set({ ...state, notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true })) })
}

/** Returns the new message's id, so the sender can undo it (WCAG 3.3.6: submissions are reversible). */
export function sendMessage(userId: string, text: string): string {
  const id = crypto.randomUUID()
  set({
    ...state,
    conversations: state.conversations.map((c) =>
      c.userId === userId
        ? {
            ...c,
            messages: [...c.messages, { id, from: ME_ID, text, sentAt: new Date().toISOString() }],
          }
        : c,
    ),
  })
  return id
}

/** Takes back a message you just sent. Only your own messages can be removed. */
export function unsendMessage(userId: string, messageId: string) {
  set({
    ...state,
    conversations: state.conversations.map((c) =>
      c.userId === userId
        ? { ...c, messages: c.messages.filter((m) => !(m.id === messageId && m.from === ME_ID)) }
        : c,
    ),
  })
}
