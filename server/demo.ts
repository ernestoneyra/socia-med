import mongoose from 'mongoose'
import { clearMedia } from './media.ts'
import {
  ConversationModel,
  FollowModel,
  LikeModel,
  NotificationModel,
  UploadModel,
} from './models.ts'
import { seedDatabase } from './seed-lib.ts'

/**
 * Demo mode: the site is open to anyone, so on a schedule everything guests changed is
 * thrown away and the sample data is put back. The time of the last reset is kept in the
 * database, so a host that sleeps and restarts the server does not reset more often than asked.
 */

export async function resetDemo() {
  await Promise.all([
    UploadModel.deleteMany({}),
    ConversationModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    LikeModel.deleteMany({}),
    FollowModel.deleteMany({}),
  ])
  await seedDatabase()
  const files = await clearMedia()
  console.log(`Demo reset: sample data restored, ${files} attached files removed.`)
}

const meta = () => mongoose.connection.db!.collection<{ _id: string; at: Date }>('meta')

async function resetIfDue(everyMs: number) {
  const last = await meta().findOne({ _id: 'lastDemoReset' })
  if (last && Date.now() - last.at.getTime() < everyMs) return
  await resetDemo()
  await meta().updateOne({ _id: 'lastDemoReset' }, { $set: { at: new Date() } }, { upsert: true })
}

/** Checks now and then every ten minutes. Returns a function that stops it. */
export function startDemoReset(hours: number): () => void {
  const everyMs = hours * 60 * 60 * 1000
  const tick = () => resetIfDue(everyMs).catch((err) => console.error('Demo reset failed:', err))
  void tick()
  const timer = setInterval(tick, 10 * 60 * 1000)
  return () => clearInterval(timer)
}
