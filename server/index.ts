import express from 'express'
import mongoose from 'mongoose'
import { connectDB } from './db.ts'
import { api } from './routes.ts'

const app = express()
const port = Number(process.env.PORT) || 5189

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

app.use('/api', api)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

// Express 5 forwards rejected promises from async handlers here.
// Express recognises an error handler by its four parameters, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

await connectDB()

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
