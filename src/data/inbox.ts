import * as api from './api.ts'
import { persist, updateData, useData } from './store.ts'
import type { Conversation, Notification } from './types.ts'

/**
 * The inbox: conversations and notifications. The header badges, the conversation list and the
 * notifications page all read from the same store, so marking something as seen updates every
 * tag at once. Changes show immediately and are saved to the server in the background.
 */
interface Inbox {
  conversations: Conversation[]
  notifications: Notification[]
}

export function useInbox(): Inbox {
  const { conversations, notifications } = useData()
  return { conversations, notifications }
}

export function unreadMessageCount(list: Conversation[]): number {
  return list.reduce((sum, c) => sum + c.unread, 0)
}

export function unreadNotificationCount(list: Notification[]): number {
  return list.filter((n) => !n.read).length
}

/** Opening a conversation reads it, and the "new message" notifications that pointed at it. */
export function markConversationRead(userId: string) {
  let changed = false
  updateData((core) => {
    const hasUnread =
      core.conversations.some((c) => c.userId === userId && c.unread > 0) ||
      core.notifications.some((n) => n.type === 'message' && n.actorId === userId && !n.read)
    if (!hasUnread) return core
    changed = true
    return {
      ...core,
      conversations: core.conversations.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c)),
      notifications: core.notifications.map((n) =>
        n.type === 'message' && n.actorId === userId ? { ...n, read: true } : n,
      ),
    }
  })
  if (changed) void persist(() => api.markConversationRead(userId))
}

export function markNotificationRead(id: string) {
  let changed = false
  updateData((core) => {
    if (!core.notifications.some((n) => n.id === id && !n.read)) return core
    changed = true
    return { ...core, notifications: core.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }
  })
  if (changed) void persist(() => api.markNotificationRead(id))
}

export function markAllNotificationsRead() {
  let changed = false
  updateData((core) => {
    if (!core.notifications.some((n) => !n.read)) return core
    changed = true
    return { ...core, notifications: core.notifications.map((n) => (n.read ? n : { ...n, read: true })) }
  })
  if (changed) void persist(() => api.markAllNotificationsRead())
}

/** Returns the new message's id, so the sender can undo it (WCAG 3.3.6: submissions are reversible). */
export function sendMessage(userId: string, text: string): string {
  const id = crypto.randomUUID()
  updateData((core) => {
    const message = { id, from: core.meId, text, sentAt: new Date().toISOString() }
    // The first message to someone starts the conversation.
    if (!core.conversations.some((c) => c.userId === userId)) {
      return { ...core, conversations: [{ userId, unread: 0, messages: [message] }, ...core.conversations] }
    }
    return {
      ...core,
      conversations: core.conversations.map((c) =>
        c.userId === userId ? { ...c, messages: [...c.messages, message] } : c,
      ),
    }
  })
  void persist(() => api.sendMessage(userId, id, text)).then((saved) => {
    if (!saved) return
    // The server's clock is the one that counts.
    updateData((core) => ({
      ...core,
      conversations: core.conversations.map((c) =>
        c.userId === userId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, sentAt: saved.sentAt } : m)) }
          : c,
      ),
    }))
  })
  return id
}

/** Takes back a message you just sent. Only your own messages can be removed. */
export function unsendMessage(userId: string, messageId: string) {
  updateData((core) => ({
    ...core,
    conversations: core.conversations.map((c) =>
      c.userId === userId
        ? { ...c, messages: c.messages.filter((m) => !(m.id === messageId && m.from === core.meId)) }
        : c,
    ),
  }))
  void persist(() => api.unsendMessage(userId, messageId))
}
