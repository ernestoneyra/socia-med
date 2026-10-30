import { setServers } from 'node:dns'
import mongoose from 'mongoose'

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.')
  }

  // mongodb+srv:// needs SRV lookups, which some local resolvers (e.g. a
  // 127.0.0.1 stub from WSL/VPN) refuse. Fall back to public DNS for those.
  if (uri.startsWith('mongodb+srv://')) {
    setServers(['8.8.8.8', '1.1.1.1'])
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  const conn = await mongoose.connect(uri)
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  return conn
}
