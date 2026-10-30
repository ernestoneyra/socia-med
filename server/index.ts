import express from 'express'
import mongoose from 'mongoose'
import { connectDB } from './db.ts'

const app = express()
const port = Number(process.env.PORT) || 5189

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

await connectDB()

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
