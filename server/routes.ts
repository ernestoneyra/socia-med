import { Router } from 'express'
import type { Conversation, Message, Notification, Upload, User } from '../src/data/types.ts'
import { ME_ID } from './config.ts'
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

api.get('/me', (_req, res) => {
  res.json({ id: ME_ID })
})

api.get('/users', async (_req, res) => {
  const [docs, follows] = await Promise.all([
    UserModel.find().lean(),
    FollowModel.find({ followerId: ME_ID }).lean(),
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
    followedByMe: followed.has(u._id),
  }))
  res.json(users)
})

api.get('/uploads', async (_req, res) => {
  const [docs, likes] = await Promise.all([
    UploadModel.find().sort({ createdAt: -1 }).lean(),
    LikeModel.find({ userId: ME_ID }).lean(),
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
  }))
  res.json(uploads)
})

api.get('/inbox', async (_req, res) => {
  const [conversationDocs, notificationDocs] = await Promise.all([
    ConversationModel.find().lean(),
    NotificationModel.find().sort({ createdAt: -1 }).lean(),
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

api.post('/conversations/:userId/messages', async (req, res) => {
  const { id, text } = req.body ?? {}
  if (typeof id !== 'string' || id.length === 0 || id.length > 64) {
    res.status(400).json({ error: 'id must be a string of 1 to 64 characters.' })
    return
  }
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `text must be 1 to ${MAX_MESSAGE_LENGTH} characters.` })
    return
  }

  const sentAt = new Date()
  const result = await ConversationModel.updateOne(
    { userId: req.params.userId },
    { $push: { messages: { _id: id, from: ME_ID, text: text.trim(), sentAt } } },
  )
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Conversation not found.' })
    return
  }
  const message: Message = { id, from: ME_ID, text: text.trim(), sentAt: toIso(sentAt) }
  res.status(201).json(message)
})

// Only your own messages can be taken back.
api.delete('/conversations/:userId/messages/:messageId', async (req, res) => {
  const result = await ConversationModel.updateOne(
    { userId: req.params.userId },
    { $pull: { messages: { _id: req.params.messageId, from: ME_ID } } },
  )
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Conversation not found.' })
    return
  }
  res.status(204).end()
})

// Opening a conversation reads it, and the "new message" notifications that pointed at it.
api.post('/conversations/:userId/read', async (req, res) => {
  const { userId } = req.params
  await Promise.all([
    ConversationModel.updateOne({ userId }, { $set: { unread: 0 } }),
    NotificationModel.updateMany(
      { type: 'message', actorId: userId, read: false },
      { $set: { read: true } },
    ),
  ])
  res.status(204).end()
})

api.post('/notifications/read-all', async (_req, res) => {
  await NotificationModel.updateMany({ read: false }, { $set: { read: true } })
  res.status(204).end()
})

api.post('/notifications/:id/read', async (req, res) => {
  const result = await NotificationModel.updateOne({ _id: req.params.id }, { $set: { read: true } })
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
  const { id } = req.params
  if (!(await UploadModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'Upload not found.' })
    return
  }
  try {
    await LikeModel.create({ userId: ME_ID, uploadId: id })
    await UploadModel.updateOne({ _id: id }, { $inc: { likes: 1 } })
  } catch (err) {
    // Already liked (including a second request racing the first): nothing to add.
    if (!isDuplicateKey(err)) throw err
  }
  const upload = await UploadModel.findById(id).select('likes').lean()
  res.json({ liked: true, likes: upload?.likes ?? 0 })
})

api.delete('/uploads/:id/like', async (req, res) => {
  const { id } = req.params
  if (!(await UploadModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'Upload not found.' })
    return
  }
  const result = await LikeModel.deleteOne({ userId: ME_ID, uploadId: id })
  if (result.deletedCount > 0) await UploadModel.updateOne({ _id: id }, { $inc: { likes: -1 } })
  const upload = await UploadModel.findById(id).select('likes').lean()
  res.json({ liked: false, likes: Math.max(0, upload?.likes ?? 0) })
})

async function followResponse(userId: string, following: boolean) {
  const user = await UserModel.findById(userId).select('followers').lean()
  return { following, followers: user?.followers ?? 0 }
}

api.put('/users/:id/follow', async (req, res) => {
  const { id } = req.params
  if (id === ME_ID) {
    res.status(400).json({ error: 'You cannot follow yourself.' })
    return
  }
  if (!(await UserModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  try {
    await FollowModel.create({ followerId: ME_ID, followingId: id })
    await Promise.all([
      UserModel.updateOne({ _id: id }, { $inc: { followers: 1 } }),
      UserModel.updateOne({ _id: ME_ID }, { $inc: { following: 1 } }),
    ])
  } catch (err) {
    if (!isDuplicateKey(err)) throw err
  }
  res.json(await followResponse(id, true))
})

api.delete('/users/:id/follow', async (req, res) => {
  const { id } = req.params
  if (!(await UserModel.exists({ _id: id }))) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  const result = await FollowModel.deleteOne({ followerId: ME_ID, followingId: id })
  if (result.deletedCount > 0) {
    await Promise.all([
      UserModel.updateOne({ _id: id }, { $inc: { followers: -1 } }),
      UserModel.updateOne({ _id: ME_ID }, { $inc: { following: -1 } }),
    ])
  }
  res.json(await followResponse(id, false))
})
