export interface User {
  id: string
  name: string
  handle: string
  bio: string
  location: string
  joined: string // ISO date
  interests: string[]
  followers: number
  following: number
  /** 0-360, drives the generated avatar and banner colours. */
  hue: number
  /** Whether the signed-in user follows this person. Always false for themselves. */
  followedByMe: boolean
}

export type UploadKind = 'photo' | 'audio' | 'video' | 'writing'

export interface Upload {
  id: string
  userId: string
  kind: UploadKind
  title: string
  caption: string
  createdAt: string // ISO date-time
  likes: number
  comments: number
  tags: string[]
  /** Seeds the generated artwork so each upload looks different but stable. */
  seed: number
  /** Audio/video length, e.g. "3:42". */
  duration?: string
  /** The attached photo, audio or video file. Writing, and the sample data, have none and show generated artwork. */
  mediaUrl?: string
  /** Text alternative for a photo. */
  alt?: string
  /** Whether the signed-in user has liked this upload. `likes` already includes their like. */
  likedByMe: boolean
}

export interface Message {
  id: string
  from: string // user id
  text: string
  sentAt: string // ISO date-time
}

export interface Conversation {
  userId: string // the other participant
  messages: Message[]
  /** How many of the trailing messages the signed-in user hasn't read. */
  unread: number
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'upload'

export interface Notification {
  id: string
  type: NotificationType
  actorId: string
  uploadId?: string
  text?: string
  createdAt: string
  read: boolean
}
