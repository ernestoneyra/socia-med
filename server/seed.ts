import mongoose from 'mongoose'
import { connectDB } from './db.ts'
import {
  ConversationModel,
  FollowModel,
  LikeModel,
  NotificationModel,
  UploadModel,
  UserModel,
} from './models.ts'
import { conversations, notifications } from './seed-data/messages.ts'
import { uploads } from './seed-data/uploads.ts'
import { users } from './seed-data/users.ts'
import { hashPassword } from './password.ts'

// Inserts the sample data from server/seed-data/ into MongoDB. Safe to re-run: every
// document is upserted by its id, so nothing is duplicated.

// Every seeded user logs in with this password (stored hashed).
const DEFAULT_PASSWORD = 'password'

/** "Tomás Lindqvist" -> "tomas.lindqvist" */
function toUsername(name: string): string {
  const parts = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  return `${parts[0]}.${parts[parts.length - 1]}`
}

async function seed() {
  await connectDB()

  const userResult = await UserModel.bulkWrite(
    users.map(({ id, ...u }) => ({
      replaceOne: {
        filter: { _id: id },
        replacement: {
          _id: id,
          ...u,
          username: toUsername(u.name),
          passwordHash: hashPassword(DEFAULT_PASSWORD),
          joined: new Date(u.joined),
        },
        upsert: true,
      },
    })),
  )

  const uploadResult = await UploadModel.bulkWrite(
    uploads.map(({ id, ...u }) => ({
      replaceOne: {
        filter: { _id: id },
        replacement: { _id: id, ...u, createdAt: new Date(u.createdAt) },
        upsert: true,
      },
    })),
  )

  const conversationResult = await ConversationModel.bulkWrite(
    conversations.map((c) => ({
      updateOne: {
        filter: { userId: c.userId },
        update: {
          $set: {
            unread: c.unread,
            messages: c.messages.map(({ id, ...m }) => ({
              _id: id,
              ...m,
              sentAt: new Date(m.sentAt),
            })),
          },
        },
        upsert: true,
      },
    })),
  )

  const notificationResult = await NotificationModel.bulkWrite(
    notifications.map(({ id, ...n }) => ({
      replaceOne: {
        filter: { _id: id },
        replacement: { _id: id, ...n, createdAt: new Date(n.createdAt) },
        upsert: true,
      },
    })),
  )

  // The sample counts above replace any live ones, so saved likes and follows would no longer
  // add up to them. Start those from scratch too.
  const [likesCleared, followsCleared] = await Promise.all([LikeModel.deleteMany({}), FollowModel.deleteMany({})])
  console.log(`likes: ${likesCleared.deletedCount} removed; follows: ${followsCleared.deletedCount} removed`)

  const report = (name: string, r: { upsertedCount: number; modifiedCount: number }) =>
    console.log(`${name}: ${r.upsertedCount} inserted, ${r.modifiedCount} updated`)

  report('users', userResult)
  report('uploads', uploadResult)
  report('conversations', conversationResult)
  report('notifications', notificationResult)

  const messageCount = conversations.reduce((n, c) => n + c.messages.length, 0)
  console.log(
    `Seeded ${users.length} users, ${uploads.length} uploads, ${conversations.length} conversations ` +
      `(${messageCount} messages), ${notifications.length} notifications.`,
  )
}

try {
  await seed()
} catch (err) {
  console.error('Seeding failed:', err)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
