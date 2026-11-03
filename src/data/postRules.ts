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

export const readableSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} megabytes` : `${Math.max(1, Math.round(bytes / 1024))} kilobytes`

/** An error message if the file cannot be used for this kind of post. */
export function validateFile(kind: UploadKind, file: { type: string; size: number } | undefined): string | undefined {
  if (!hasFile(kind)) return undefined
  if (!file) return `Choose a ${kind} file to attach.`
  if (!(file.type in MEDIA_TYPES[kind])) return `That file is not a supported ${kind} file. Choose a different one.`
  if (file.size === 0) return 'That file is empty. Choose a different one.'
  if (file.size > MAX_MEDIA_BYTES) return `That file is too large. The most you can attach is ${readableSize(MAX_MEDIA_BYTES)}.`
  return undefined
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

export type PostErrors = Partial<Record<'kind' | 'file' | 'title' | 'caption' | 'tags' | 'duration', string>>

export function validatePost(post: PostInput): PostErrors {
  const errors: PostErrors = {}
  if (!POST_KINDS.includes(post.kind)) errors.kind = 'Choose what kind of post this is.'
  if (!post.title.trim()) errors.title = 'Enter a title.'
  else if (post.title.trim().length > MAX_TITLE) errors.title = `Use ${MAX_TITLE} characters or fewer for the title.`
  if (post.caption.length > MAX_CAPTION) errors.caption = `Use ${MAX_CAPTION} characters or fewer for the caption.`
  if (post.tags.length > MAX_TAGS) errors.tags = `Use ${MAX_TAGS} tags or fewer.`
  else if (post.tags.some((t) => t.length > MAX_TAG_LENGTH)) {
    errors.tags = `Keep each tag to ${MAX_TAG_LENGTH} characters or fewer.`
  }
  if (post.duration && !DURATION_PATTERN.test(post.duration)) errors.duration = 'The length is not in a valid format.'
  return errors
}
