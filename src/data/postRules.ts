import { m, type Msg } from '../i18n/core.ts'
import type { UploadKind } from './types.ts'

/** What makes a new post valid. Shared, so the form and the server agree. */

export const POST_KINDS: UploadKind[] = ['photo', 'audio', 'video', 'writing']
export const MAX_TITLE = 100
export const MAX_CAPTION = 1000
export const MAX_TAGS = 8
export const MAX_TAG_LENGTH = 30
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024

/** "3:42", "12:48" or "1:02:03". Read from the file itself, never typed. */
export const DURATION_PATTERN = /^(?:\d{1,2}:)?\d{1,2}:[0-5]\d$/

/** Accepted file types per kind, and the extension each is stored with. Writing has no file. */
export const MEDIA_TYPES: Record<Exclude<UploadKind, 'writing'>, Record<string, string>> = {
  photo: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' },
  audio: {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
  },
  video: { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv' },
}

export const ALL_MEDIA_TYPES = Object.values(MEDIA_TYPES).flatMap((types) => Object.keys(types))

/** Photo, audio and video carry a file; writing does not. */
export const hasFile = (kind: UploadKind): kind is Exclude<UploadKind, 'writing'> => kind !== 'writing'

export const kindOfMediaType = (type: string): Exclude<UploadKind, 'writing'> | undefined =>
  (Object.keys(MEDIA_TYPES) as (keyof typeof MEDIA_TYPES)[]).find((k) => type in MEDIA_TYPES[k])

/** The `accept` value for the file picker of this kind of post. */
export const acceptFor = (kind: Exclude<UploadKind, 'writing'>) => Object.keys(MEDIA_TYPES[kind]).join(',')

/** "25.0 megabytes" / "300 kilobytes", as a message so it is written in the reader's language. */
export const readableSize = (bytes: number): Msg =>
  bytes >= 1024 * 1024
    ? m('size.megabytes', { n: (bytes / (1024 * 1024)).toFixed(1) })
    : m('size.kilobytes', { n: Math.max(1, Math.round(bytes / 1024)) })

/** What the problem file is called in the error message. */
type FileNoun = Exclude<UploadKind, 'writing'> | 'background'

/** An error message if the file cannot be used for this kind of post. */
function checkFile(noun: FileNoun, file: { type: string; size: number } | undefined, accepted: Record<string, string>): Msg | undefined {
  const kind = m(`kind.${noun}`)
  if (!file) return m('rule.fileRequired', { kind })
  if (!(file.type in accepted)) return m('rule.fileUnsupported', { kind })
  if (file.size === 0) return m('rule.fileEmpty')
  if (file.size > MAX_MEDIA_BYTES) return m('rule.fileTooLarge', { size: readableSize(MAX_MEDIA_BYTES) })
  return undefined
}

export function validateFile(kind: UploadKind, file: { type: string; size: number } | undefined): Msg | undefined {
  if (!hasFile(kind)) return undefined
  return checkFile(kind, file, MEDIA_TYPES[kind])
}

/** A profile photo is held to a smaller limit than a post's file. */
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024
export const MAX_AVATAR_LABEL = '3MB'

/** An error message if the file cannot be used as a profile photo or a background image. */
export function validateAvatar(
  file: { type: string; size: number } | undefined,
  noun: 'photo' | 'background' = 'photo',
): Msg | undefined {
  if (file && file.size > MAX_AVATAR_BYTES) {
    return m('rule.imageTooLarge', { kind: m(`kind.${noun}`), size: MAX_AVATAR_LABEL })
  }
  return checkFile(noun, file, MEDIA_TYPES.photo)
}

/** "Street, #Night  light" -> ["street", "night", "light"]. Commas, spaces and a leading # are all fine. */
export function parseTags(text: string): string[] {
  const tags = text
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, '').toLowerCase())
    .filter(Boolean)
  return [...new Set(tags)]
}

export interface PostInput {
  kind: UploadKind
  title: string
  caption: string
  tags: string[]
  /** Length of audio or video, read from the file. */
  duration?: string
}

export type PostErrors = Partial<Record<'kind' | 'file' | 'title' | 'caption' | 'tags' | 'duration', Msg>>

export function validatePost(post: PostInput): PostErrors {
  const errors: PostErrors = {}
  if (!POST_KINDS.includes(post.kind)) errors.kind = m('rule.kindRequired')
  if (!post.title.trim()) errors.title = m('rule.titleRequired')
  else if (post.title.trim().length > MAX_TITLE) errors.title = m('rule.titleTooLong', { max: MAX_TITLE })
  if (post.caption.length > MAX_CAPTION) errors.caption = m('rule.captionTooLong', { max: MAX_CAPTION })
  if (post.tags.length > MAX_TAGS) errors.tags = m('rule.tooManyTags', { max: MAX_TAGS })
  else if (post.tags.some((t) => t.length > MAX_TAG_LENGTH)) {
    errors.tags = m('rule.tagTooLong', { max: MAX_TAG_LENGTH })
  }
  if (post.duration && !DURATION_PATTERN.test(post.duration)) errors.duration = m('rule.durationInvalid')
  return errors
}
