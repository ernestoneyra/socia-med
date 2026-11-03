import type { RequestHandler } from 'express'

/**
 * A small in-memory limit per client address, so one visitor cannot fill a public demo with
 * uploads. It resets when the server restarts, which is fine for a demo.
 */
export function rateLimit({ max, windowMs, message }: { max: number; windowMs: number; message: string }): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (req, res, next) => {
    const now = Date.now()
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
    const key = req.ip ?? 'unknown'
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }
    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      res.status(429).json({ error: message })
      return
    }
    entry.count++
    next()
  }
}
