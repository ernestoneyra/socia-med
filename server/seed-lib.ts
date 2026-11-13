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
import { ME_ID } from './config.ts'
import { hashPassword } from './password.ts'

// Inserts the sample data from server/seed-data/ into MongoDB. Safe to re-run: every
// document is upserted by its id, so nothing is duplicated.

// Every seeded user signs in with this password (stored hashed), until their account is changed by hand.
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

/** Writes the sample data into the connected database. Does not connect or disconnect. */
export async function seedDatabase() {
  const hashes = await Promise.all(users.map(() => hashPassword(DEFAULT_PASSWORD)))
  const userResult = await UserModel.bulkWrite(
    users.map(({ id, ...u }, i) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            ...u,
            username: toUsername(u.name),
            joined: new Date(u.joined),
          },
          // Only for a new user: re-seeding must never reset a password that is already set.
          $setOnInsert: { passwordHash: hashes[i] },
        },
        upsert: true,
      },
    })),
  )

  const uploadResult = await UploadModel.bulkWrite(
    uploads.map(({ id, ...u }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { ...u, createdAt: new Date(u.createdAt) } },
        upsert: true,
      },
    })),
  )

  const conversationResult = await ConversationModel.bulkWrite(
    conversations.map((c) => ({
      updateOne: {
        // The sample inbox is the sample user's. Other accounts start with an empty one.
        filter: { ownerId: ME_ID, userId: c.userId },
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
      updateOne: {
        filter: { _id: id },
        update: { $set: { ...n, recipientId: ME_ID, createdAt: new Date(n.createdAt) } },
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

