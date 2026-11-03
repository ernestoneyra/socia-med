import type { Conversation, Message, Notification, Upload, User } from './types.ts'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.headers ?? (init?.body ? { 'Content-Type': 'application/json' } : undefined),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = ((await res.json()) as { error?: string }).error ?? ''
    } catch {
      // Not JSON (for example a proxy error page): the status line is all there is.
    }
    throw new Error(`${init?.method ?? 'GET'} /api${path} failed: ${res.status}${detail ? ` ${detail}` : ''}`)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export interface Snapshot {
  meId: string
  users: User[]
  uploads: Upload[]
  conversations: Conversation[]
  notifications: Notification[]
}

export async function fetchSnapshot(): Promise<Snapshot> {
  const [me, users, uploads, inbox] = await Promise.all([
    request<{ id: string }>('/me'),
    request<User[]>('/users'),
    request<Upload[]>('/uploads'),
    request<{ conversations: Conversation[]; notifications: Notification[] }>('/inbox'),
  ])
  return { meId: me.id, users, uploads, ...inbox }
}

const enc = encodeURIComponent

export const sendMessage = (userId: string, id: string, text: string) =>
  request<Message>(`/conversations/${enc(userId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ id, text }),
  })

export const unsendMessage = (userId: string, messageId: string) =>
  request<void>(`/conversations/${enc(userId)}/messages/${enc(messageId)}`, { method: 'DELETE' })

export const markConversationRead = (userId: string) =>
  request<void>(`/conversations/${enc(userId)}/read`, { method: 'POST' })

export const markNotificationRead = (id: string) =>
  request<void>(`/notifications/${enc(id)}/read`, { method: 'POST' })

/** Sends the file itself as the request body; the server answers with the URL it is stored at. */
export const uploadMedia = (file: File) =>
  request<{ url: string }>('/media', { method: 'POST', body: file, headers: { 'Content-Type': file.type } })

export const createUpload = (
  upload: Pick<Upload, 'id' | 'seed' | 'kind' | 'title' | 'caption' | 'tags' | 'duration' | 'mediaUrl'>,
) =>
  request<Upload>('/uploads', { method: 'POST', body: JSON.stringify(upload) })

export const setLiked = (uploadId: string, liked: boolean) =>
  request<{ liked: boolean; likes: number }>(`/uploads/${enc(uploadId)}/like`, {
    method: liked ? 'PUT' : 'DELETE',
  })

export const setFollowing = (userId: string, following: boolean) =>
  request<{ following: boolean; followers: number }>(`/users/${enc(userId)}/follow`, {
    method: following ? 'PUT' : 'DELETE',
  })

export const markAllNotificationsRead = () => request<void>('/notifications/read-all', { method: 'POST' })
