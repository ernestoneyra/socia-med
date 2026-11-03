import mongoose from 'mongoose'
import { connectDB } from './db.ts'
import { seedDatabase } from './seed-lib.ts'

// `npm run seed` inserts the sample data from server/seed-data/ into MongoDB. Safe to re-run:
// every document is upserted by its id, so nothing is duplicated.

try {
  await connectDB()
  await seedDatabase()
} catch (err) {
  console.error('Seeding failed:', err)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
