import { randomUUID } from 'node:crypto'
import { access, stat } from 'node:fs/promises'
import { join } from 'node:path'
import express, { Router } from 'express'
import type { Conversation, Message, Notification, Upload, User } from '../src/data/types.ts'
import {
  ALL_MEDIA_TYPES,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_LABEL,
  MAX_MEDIA_BYTES,
  MEDIA_TYPES,
  hasFile,
  kindOfMediaType,
  validatePost,
  type PostInput,
} from '../src/data/postRules.ts'
import { translateMsg } from '../src/i18n/core.ts'
import { authRouter, currentUserId, requireAuth } from './auth.ts'
import { MEDIA_DIR, MEDIA_URL_PATTERN, deleteMedia, saveMedia } from './media.ts'
import { rateLimit } from './rateLimit.ts'
import {
  ConversationModel,
  FollowModel,
  LikeModel,
  NotificationModel,
  UploadModel,
  UserModel,
} from './models.ts'

// Documents are edited by hand in MongoDB too, so fields the schema would
// normally default are tolerated as missing here instead of crashing the client.

const toIso = (d: Date) => d.toISOString()

export const api = Router()

// Always answer from the database. A cached response is exactly how a direct
// edit in MongoDB would appear not to show up in the app.
api.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// The site can be public, so writes are limited per visitor: a lot of ordinary use, but not a flood.
const anyWrite = rateLimit({ max: 300, windowMs: 10 * 60_000, message: 'Too many changes in a short time. Wait a few minutes and try again.' })
const fileWrite = rateLimit({ max: 20, windowMs: 10 * 60_000, message: 'Too many files attached in a short time. Wait a few minutes and try again.' })
api.use((req, res, next) => (req.method === 'GET' ? next() : anyWrite(req, res, next)))

// Register, sign in and sign out are open to everyone; everything after this line needs an account.
api.use('/auth', authRouter)
api.use(requireAuth)

api.get('/me', async (_req, res) => {
  const me = currentUserId(res)
  // A session whose account has since been removed is no session at all.
  if (!(await UserModel.exists({ _id: me }))) {
    res.status(401).json({ error: 'Sign in to continue.' })
    return
  }
  res.json({ id: me })
})

api.get('/users', async (_req, res) => {
  const me = currentUserId(res)
  const [docs, follows] = await Promise.all([
    UserModel.find().lean(),
    FollowModel.find({ followerId: me }).lean(),
  ])
  const followed = new Set(follows.map((f) => f.followingId))
  const users: User[] = docs.map((u) => ({
    id: u._id,
    name: u.name,
    handle: u.handle,
    bio: u.bio ?? '',
    location: u.location ?? '',
    joined: toIso(u.joined).slice(0, 10),
    interests: u.interests ?? [],
    followers: u.followers ?? 0,
    following: u.following ?? 0,
    hue: u.hue ?? 0,
    ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
    ...(u.backgroundUrl ? { backgroundUrl: u.backgroundUrl } : {}),
    followedByMe: followed.has(u._id),
  }))
  res.json(users)
})

// The profile photo and the background image are photos sent to /media first; these point the
// signed-in user's profile at one. Both share a size limit smaller than a post's file.
for (const [route, field] of [
  ['avatar', 'avatarUrl'],
  ['background', 'backgroundUrl'],
] as const) {
  api.put(`/me/${route}`, async (req, res) => {
    const me = currentUserId(res)
    const { url } = req.body ?? {}
    const extension = typeof url === 'string' ? MEDIA_URL_PATTERN.exec(url)?.[1] : undefined
    if (typeof url !== 'string' || !extension || !Object.values(MEDIA_TYPES.photo).includes(extension)) {
      res.status(400).json({ error: 'Choose a photo.' })
      return
    }
    let size: number
    try {
      size = (await stat(join(MEDIA_DIR, url.slice('/media/'.length)))).size
    } catch {
      res.status(400).json({ error: 'The photo was not found. Choose it again.' })
      return
    }
    // The upload endpoint allows larger files (for posts), so the profile limit is checked here.
    if (size > MAX_AVATAR_BYTES) {
      await deleteMedia(url)
      res.status(400).json({ error: `That photo is too large. The most you can use is ${MAX_AVATAR_LABEL}.` })
      return
    }
    const user = await UserModel.findById(me).select(field)
    if (!user) {
      res.status(401).json({ error: 'Sign in to continue.' })
      return
    }
    const previous = user[field]
    user[field] = url
    await user.save()
    if (previous && previous !== url) await deleteMedia(previous)
    res.json({ url })
  })

  api.delete(`/me/${route}`, async (_req, res) => {
    const user = await UserModel.findById(currentUserId(res)).select(field)
    const previous = user?.[field]
    if (user && previous) {
      user[field] = undefined
      await user.save()
      await deleteMedia(previous)
    }
    res.status(204).end()
  })
}

api.get('/uploads', async (_req, res) => {
  const me = currentUserId(res)
  const [docs, likes] = await Promise.all([
    UploadModel.find().sort({ createdAt: -1 }).lean(),
    LikeModel.find({ userId: me }).lean(),
  ])
  const liked = new Set(likes.map((l) => l.uploadId))
  const uploads: Upload[] = docs.map((u) => ({
    id: u._id,
    userId: u.userId,
    kind: u.kind,
    title: u.title,
    caption: u.caption ?? '',
    createdAt: toIso(u.createdAt),
    likes: u.likes ?? 0,
    comments: u.comments ?? 0,
    tags: u.tags ?? [],
    seed: u.seed,
    likedByMe: liked.has(u._id),
    ...(u.duration ? { duration: u.duration } : {}),
    ...(u.mediaUrl ? { mediaUrl: u.mediaUrl } : {}),
  }))
  res.json(uploads)
})

// An attached file is sent first, as the raw request body, and the post then points at the
// URL this returns. The server picks the name and the extension from the (allow-listed) type.
api.post(
  '/media',
  fileWrite,
  express.raw({ type: ALL_MEDIA_TYPES, limit: MAX_MEDIA_BYTES }),
  async (req, res) => {
    const type = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() ?? ''
    const kind = kindOfMediaType(type)
    if (!kind || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(415).json({ error: 'Send a photo, audio or video file as the request body.' })
      return
    }
    const url = await saveMedia(req.body, MEDIA_TYPES[kind][type])
    res.status(201).json({ url })
  },
)

// New posts are always by the signed-in user. The server decides when it was posted.
api.post('/uploads', async (req, res) => {
  const me = currentUserId(res)
  const { id, seed, kind, title, caption, tags, duration, mediaUrl } = req.body ?? {}
  if (typeof id !== 'string' || id.length === 0 || id.length > 64) {
    res.status(400).json({ error: 'id must be a string of 1 to 64 characters.' })
    return
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 1_000_000) {
    res.status(400).json({ error: 'seed must be a whole number from 0 to 1000000.' })
    return
  }
  if (
    typeof title !== 'string' ||
    typeof caption !== 'string' ||
    !Array.isArray(tags) ||
    !tags.every((t) => typeof t === 'string') ||
    (duration !== undefined && typeof duration !== 'string') ||
    (mediaUrl !== undefined && typeof mediaUrl !== 'string')
  ) {
    res.status(400).json({ error: 'title, caption, tags, duration and mediaUrl have the wrong type.' })
    return
  }
  const post: PostInput = {
    kind,
    title,
    caption,
    tags,
    ...(duration ? { duration } : {}),
  }
  const errors = validatePost(post)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    res.status(400).json({ error: translateMsg('en', firstError) })
    return
  }

  // Photo, audio and video need a file this server stored, of the matching kind.
  let storedUrl: string | undefined
  if (hasFile(kind)) {
    const extension = typeof mediaUrl === 'string' ? MEDIA_URL_PATTERN.exec(mediaUrl)?.[1] : undefined
    if (!mediaUrl || !extension || !Object.values(MEDIA_TYPES[kind]).includes(extension)) {
      res.status(400).json({ error: `Attach a ${kind} file to post it.` })
      return
    }
    try {
      await access(join(MEDIA_DIR, mediaUrl.slice('/media/'.length)))
    } catch {
      res.status(400).json({ error: 'The attached file was not found. Attach it again.' })
      return
    }
    storedUrl = mediaUrl
  }
  if (await UploadModel.exists({ _id: id })) {
    res.status(409).json({ error: 'A post with that id already exists.' })
    return
  }

  const createdAt = new Date()
  const extras = {
    ...(hasFile(kind) && duration && kind !== 'photo' ? { duration: duration as string } : {}),
    ...(storedUrl ? { mediaUrl: storedUrl } : {}),
  }
  const doc = {
    _id: id,
    userId: me,
    kind,
    title: title.trim(),
    caption: caption.trim(),
    createdAt,
    tags,
    seed,
    ...extras,
  }
  await UploadModel.create(doc)
  const upload: Upload = {
    id,
    userId: me,
    kind,
    title: doc.title,
    caption: doc.caption,
    createdAt: toIso(createdAt),
    likes: 0,
    comments: 0,
    tags,
    seed,
    likedByMe: false,
    ...extras,
  }
  res.status(201).json(upload)
})

// Only your own posts can be changed or removed. The type and the attached file stay as posted.
api.patch('/uploads/:id', async (req, res) => {
  const upload = await UploadModel.findById(req.params.id)
  if (!upload) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  if (upload.userId !== currentUserId(res)) {
    res.status(403).json({ error: 'You can only edit your own posts.' })
    return
  }
  const { title, caption, tags } = req.body ?? {}
  if (
    typeof title !== 'string' ||
    typeof caption !== 'string' ||
    !Array.isArray(tags) ||
    !tags.every((t) => typeof t === 'string')
  ) {
    res.status(400).json({ error: 'title, caption and tags have the wrong type.' })
    return
  }
  const errors = validatePost({ kind: upload.kind, title, caption, tags })
  const firstError = Object.values(errors)[0]
  if (firstError) {
    res.status(400).json({ error: translateMsg('en', firstError) })
    return
  }
  upload.title = title.trim()
  upload.caption = caption.trim()
  upload.tags = tags
  await upload.save()
  res.json({ id: upload._id, title: upload.title, caption: upload.caption, tags: upload.tags })
})

api.delete('/uploads/:id', async (req, res) => {
  const upload = await UploadModel.findById(req.params.id).lean()
  if (!upload) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  if (upload.userId !== currentUserId(res)) {
    res.status(403).json({ error: 'You can only delete your own posts.' })
    return
  }
  await Promise.all([
    UploadModel.deleteOne({ _id: upload._id }),
    LikeModel.deleteMany({ uploadId: upload._id }),
    NotificationModel.deleteMany({ uploadId: upload._id }),
  ])
  await deleteMedia(upload.mediaUrl ?? undefined)
  res.status(204).end()
})

api.get('/inbox', async (_req, res) => {
  const me = currentUserId(res)
  const [conversationDocs, notificationDocs] = await Promise.all([
    ConversationModel.find({ ownerId: me }).lean(),
    NotificationModel.find({ recipientId: me }).sort({ createdAt: -1 }).lean(),
  ])

  const conversations: Conversation[] = conversationDocs
    .map((c) => ({
      userId: c.userId,
      unread: c.unread ?? 0,
      messages: (c.messages ?? [])
        .map((m): Message => ({ id: m._id, from: m.from, text: m.text, sentAt: toIso(m.sentAt) }))
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    }))
    // Most recently active conversation first.
    .sort((a, b) => (b.messages.at(-1)?.sentAt ?? '').localeCompare(a.messages.at(-1)?.sentAt ?? ''))

  const notifications: Notification[] = notificationDocs.map((n) => ({
    id: n._id,
    type: n.type,
    actorId: n.actorId,
    ...(n.uploadId ? { uploadId: n.uploadId } : {}),
    ...(n.text ? { text: n.text } : {}),
    createdAt: toIso(n.createdAt),
    read: n.read ?? false,
  }))

  res.json({ conversations, notifications })
})

const MAX_MESSAGE_LENGTH = 2000
/** How much of a message the recipient's notification shows. */
const NOTIFICATION_PREVIEW = 100

// Each person has their own copy of a conversation (see the model). Messaging someone you have not
// written to before starts one, and every message is delivered into the other person's copy too.
// `upsert` can race with a second request creating the same conversation; the unique index then
// rejects one of them, and asking again finds the one that won.
async function upsertConversation(
  ownerId: string,
  userId: string,
  update: Parameters<typeof ConversationModel.updateOne>[1],
) {
  try {
    await ConversationModel.updateOne({ ownerId, userId }, update, { upsert: true })
  } catch (err) {
    if (!isDuplicateKey(err)) throw err
    await ConversationModel.updateOne({ ownerId, userId }, update, { upsert: true })
  }
}

api.post('/conversations/:userId/messages', async (req, res) => {
  const me = currentUserId(res)
  const other = req.params.userId
  const { id, text } = req.body ?? {}
  if (typeof id !== 'string' || id.length === 0 || id.length > 64) {
    res.status(400).json({ error: 'id must be a string of 1 to 64 characters.' })
    return
  }
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `text must be 1 to ${MAX_MESSAGE_LENGTH} characters.` })
    return
  }
  if (other === me) {
    res.status(400).json({ error: 'You cannot message yourself.' })
    return
  }
  if (!(await UserModel.exists({ _id: other }))) {
    res.status(404).json({ error: 'User not found.' })
    return
  }

  const body = text.trim()
  const sentAt = new Date()
  const entry = { _id: id, from: me, text: body, sentAt }
  await Promise.all([
    upsertConversation(me, other, { $push: { messages: entry } }),
    upsertConversation(other, me, { $push: { messages: entry }, $inc: { unread: 1 } }),
  ])

  // One notification for a run of unread messages from the same person, not one per message.
  const preview = body.length > NOTIFICATION_PREVIEW ? `${body.slice(0, NOTIFICATION_PREVIEW - 1)}…` : body
  const bumped = await NotificationModel.updateOne(
    { recipientId: other, type: 'message', actorId: me, read: false },
    { $set: { text: preview, createdAt: sentAt } },
  )
  if (bumped.matchedCount === 0) {
    await NotificationModel.create({
      _id: randomUUID(),
      recipientId: other,
      type: 'message',
      actorId: me,
      text: preview,
      createdAt: sentAt,
      read: false,
    })
  }

  const message: Message = { id, from: me, text: body, sentAt: toIso(sentAt) }
  res.status(201).json(message)
})

// Only your own messages can be taken back, and taking one back removes it from the other person's copy too.
api.delete('/conversations/:userId/messages/:messageId', async (req, res) => {
  const me = currentUserId(res)
  const { userId: other, messageId } = req.params
  const result = await ConversationModel.updateOne(
    { ownerId: me, userId: other },
    { $pull: { messages: { _id: messageId, from: me } } },
  )
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Conversation not found.' })
    return
  }

  const theirs = await ConversationModel.findOne({ ownerId: other, userId: me }).lean()
  const at = theirs?.messages.findIndex((m) => m._id === messageId && m.from === me) ?? -1
  if (theirs && at >= 0) {
    // The newest `unread` messages are the ones they have not opened yet.
    const wasUnread = theirs.messages.length - at <= (theirs.unread ?? 0)
    const unread = wasUnread ? theirs.unread - 1 : (theirs.unread ?? 0)
    await ConversationModel.updateOne(
      { ownerId: other, userId: me },
      { $pull: { messages: { _id: messageId, from: me } }, $set: { unread } },
    )
    // Nothing left unread, so the notification that pointed at it has nothing to point at.
    if (wasUnread && unread === 0) {
      await NotificationModel.deleteMany({ recipientId: other, type: 'message', actorId: me, read: false })
    }
  }
  res.status(204).end()
})

// Opening a conversation reads it, and the "new message" notifications that pointed at it.
api.post('/conversations/:userId/read', async (req, res) => {
  const me = currentUserId(res)
  const { userId } = req.params
  await Promise.all([
    ConversationModel.updateOne({ ownerId: me, userId }, { $set: { unread: 0 } }),
    NotificationModel.updateMany(
      { recipientId: me, type: 'message', actorId: userId, read: false },
      { $set: { read: true } },
    ),
  ])
  res.status(204).end()
})

api.post('/notifications/read-all', async (_req, res) => {
  await NotificationModel.updateMany({ recipientId: currentUserId(res), read: false }, { $set: { read: true } })
  res.status(204).end()
})

api.post('/notifications/:id/read', async (req, res) => {
  const result = await NotificationModel.updateOne(
    { _id: req.params.id, recipientId: currentUserId(res) },
    { $set: { read: true } },
  )
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Notification not found.' })
    return
  }
  res.status(204).end()
})

// --- Likes and follows ---------------------------------------------------------------------
// PUT and DELETE say which state you want, so repeating a request changes nothing. The stored
// counts only move when a row really was added or removed (the unique index decides which).

/** A duplicate-key error means the row already exists. */
const isDuplicateKey = (err: unknown) => (err as { code?: number } | null)?.code === 11000

api.put('/uploads/:id/like', async (req, res) => {
  const me = currentUserId(res)
  const { id } = req.params
  if (!(await UploadModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'Upload not found.' })
    return
  }
  try {
    await LikeModel.create({ userId: me, uploadId: id })
    await UploadModel.updateOne({ _id: id }, { $inc: { likes: 1 } })
  } catch (err) {
    // Already liked (including a second request racing the first): nothing to add.
    if (!isDuplicateKey(err)) throw err
  }
  const upload = await UploadModel.findById(id).select('likes').lean()
  res.json({ liked: true, likes: upload?.likes ?? 0 })
})

api.delete('/uploads/:id/like', async (req, res) => {
  const me = currentUserId(res)
  const { id } = req.params
  if (!(await UploadModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'Upload not found.' })
    return
  }
  const result = await LikeModel.deleteOne({ userId: me, uploadId: id })
  if (result.deletedCount > 0) await UploadModel.updateOne({ _id: id }, { $inc: { likes: -1 } })
  const upload = await UploadModel.findById(id).select('likes').lean()
  res.json({ liked: false, likes: Math.max(0, upload?.likes ?? 0) })
})

async function followResponse(userId: string, following: boolean) {
  const user = await UserModel.findById(userId).select('followers').lean()
  return { following, followers: user?.followers ?? 0 }
}

api.put('/users/:id/follow', async (req, res) => {
  const me = currentUserId(res)
  const { id } = req.params
  if (id === me) {
    res.status(400).json({ error: 'You cannot follow yourself.' })
    return
  }
  if (!(await UserModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  try {
    await FollowModel.create({ followerId: me, followingId: id })
    await Promise.all([
      UserModel.updateOne({ _id: id }, { $inc: { followers: 1 } }),
      UserModel.updateOne({ _id: me }, { $inc: { following: 1 } }),
    ])
  } catch (err) {
    if (!isDuplicateKey(err)) throw err
  }
  res.json(await followResponse(id, true))
})

api.delete('/users/:id/follow', async (req, res) => {
  const me = currentUserId(res)
  const { id } = req.params
  if (!(await UserModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  const result = await FollowModel.deleteOne({ followerId: me, followingId: id })
  if (result.deletedCount > 0) {
    await Promise.all([
      UserModel.updateOne({ _id: id }, { $inc: { followers: -1 } }),
      UserModel.updateOne({ _id: me }, { $inc: { following: -1 } }),
    ])
  }
  res.json(await followResponse(id, false))
})
