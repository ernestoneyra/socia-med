import { existsSync } from 'node:fs'
import { join } from 'node:path'
import express from 'express'
import mongoose from 'mongoose'
import { connectDB } from './db.ts'
import { startDemoReset } from './demo.ts'
import { MEDIA_DIR } from './media.ts'
import { api } from './routes.ts'

const app = express()
const port = Number(process.env.PORT) || 5189

// Behind Render's proxy: use the visitor's address, not the proxy's, for rate limits.
app.set('trust proxy', 1)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// Attached files. Named by the server, so a file can never be served as a different type.
app.use(
  '/media',
  express.static(MEDIA_DIR, {
    immutable: true,
    maxAge: '1y',
    fallthrough: false,
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  }),
)

app.use('/api', api)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

// In production the built client is served from here too, so one service runs the whole app.
// The router is hash-based, so every page is the same index.html.
const clientDir = join(import.meta.dirname, '..', 'dist')
if (existsSync(clientDir)) {
  app.use(express.static(clientDir))
}

// Express 5 forwards rejected promises from async handlers here.
// Express recognises an error handler by its four parameters, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as { status?: number } | null)?.status
  if (status === 413) {
    res.status(413).json({ error: 'That file is too large.' })
    return
  }
  if (status === 404) {
    res.status(404).json({ error: 'Not found.' })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

await connectDB()

// DEMO_RESET_HOURS=24 restores the sample data (and clears attached files) once a day.
const resetHours = Number(process.env.DEMO_RESET_HOURS)
if (resetHours > 0) startDemoReset(resetHours)

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
