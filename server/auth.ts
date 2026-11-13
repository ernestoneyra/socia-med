import { createHash, randomBytes, randomInt } from 'node:crypto'
import { Router, type Request, type RequestHandler, type Response } from 'express'
import {
  MAX_PASSWORD,
  normalizeName,
  normalizeUsername,
  validateRegistration,
} from '../src/data/accountRules.ts'
import { translateMsg } from '../src/i18n/core.ts'
import { hashPassword, verifyPassword } from './password.ts'
import { rateLimit } from './rateLimit.ts'
import { SessionModel, UserModel } from './models.ts'

/**
 * Accounts and sign-in. A signed-in browser holds a random token in an httpOnly cookie; the server
 * keeps only its hash, with the user it belongs to. Every other API route sits behind `requireAuth`
 * and asks `currentUserId` who is calling, so each person only ever sees and changes their own things.
 */

const COOKIE = 'sid'
const SESSION_MS = 30 * 24 * 60 * 60 * 1000

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function readToken(req: Request): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const at = part.indexOf('=')
    if (at > 0 && part.slice(0, at).trim() === COOKIE) return part.slice(at + 1).trim() || undefined
  }
  return undefined
}

// Not readable from scripts, not sent along with requests from other sites, and only over
// HTTPS when the request came in over HTTPS (behind Render's proxy `req.secure` reflects that).
const cookieOptions = (req: Request) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: req.secure,
  path: '/',
})

/** Forgets the session this request arrived with, if any. */
async function dropSession(req: Request) {
  const token = readToken(req)
  if (token) await SessionModel.deleteOne({ _id: hashToken(token) })
}

/** Always a brand new token, so one that was known before signing in is worthless afterwards. */
async function startSession(req: Request, res: Response, userId: string) {
  await dropSession(req)
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MS)
  await SessionModel.create({ _id: hashToken(token), userId, expiresAt })
  res.cookie(COOKIE, token, { ...cookieOptions(req), expires: expiresAt })
}

/** Lets the request through only for a signed-in user. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = readToken(req)
  // The database removes expired sessions on a timer, so check the time here as well.
  const session = token
    ? await SessionModel.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } }).lean()
    : null
  if (!session) {
    res.status(401).json({ error: 'Sign in to continue.' })
    return
  }
  res.locals.userId = session.userId
  next()
}

/** The id of the signed-in user. Only meaningful in a handler that runs after `requireAuth`. */
export const currentUserId = (res: Response): string => res.locals.userId as string

// Guessing passwords and mass-creating accounts are the two things worth slowing down.
const loginLimit = rateLimit({
  max: 20,
  windowMs: 10 * 60_000,
  message: 'Too many sign-in attempts. Wait a few minutes and try again.',
})
const registerLimit = rateLimit({
  max: 10,
  windowMs: 60 * 60_000,
  message: 'Too many accounts were created from this connection. Try again later.',
})

// Checked against when the username does not exist, so a wrong username takes as long to
// answer as a wrong password and the response time does not reveal which usernames exist.
const DECOY_HASH = await hashPassword(randomBytes(16).toString('hex'))

const isDuplicateKey = (err: unknown) => (err as { code?: number } | null)?.code === 11000

export const authRouter = Router()

authRouter.post('/register', registerLimit, async (req, res) => {
  const { name, username, password } = req.body ?? {}
  if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'name, username and password must be text.' })
    return
  }
  const errors = validateRegistration({ name, username, password })
  const firstError = Object.values(errors)[0]
  if (firstError) {
    // The page checks the same rules and shows them in its own language; these are for other clients.
    res.status(400).json({ error: translateMsg('en', firstError) })
    return
  }

  // The username is also the new account's handle and id, so it must be free as all three.
  const login = normalizeUsername(username)
  const taken = { error: 'That username is already taken. Choose another one.' }
  if (await UserModel.exists({ $or: [{ _id: login }, { username: login }, { handle: login }] })) {
    res.status(409).json(taken)
    return
  }

  try {
    await UserModel.create({
      _id: login,
      name: normalizeName(name),
      handle: login,
      username: login,
      passwordHash: await hashPassword(password),
      joined: new Date(),
      hue: randomInt(0, 361),
    })
  } catch (err) {
    // Someone else registered the same name between the check above and the insert.
    if (!isDuplicateKey(err)) throw err
    res.status(409).json(taken)
    return
  }

  await startSession(req, res, login)
  res.status(201).json({ id: login })
})

authRouter.post('/login', loginLimit, async (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    res.status(400).json({ error: 'Enter your username and password.' })
    return
  }
  // Longer than any password can be: reject before spending time hashing it.
  if (password.length > MAX_PASSWORD) {
    res.status(401).json({ error: 'Wrong username or password.' })
    return
  }

  const user = await UserModel.findOne({ username: normalizeUsername(username) }).select('+passwordHash').lean()
  const valid = await verifyPassword(password, user?.passwordHash ?? DECOY_HASH)
  if (!user || !valid) {
    // The same answer for an unknown username and a wrong password.
    res.status(401).json({ error: 'Wrong username or password.' })
    return
  }

  await startSession(req, res, user._id)
  res.json({ id: user._id })
})

// Works whether or not you are signed in, so a stale tab can always finish signing out.
authRouter.post('/logout', async (req, res) => {
  await dropSession(req)
  res.clearCookie(COOKIE, cookieOptions(req))
  res.status(204).end()
})
