import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const KEY_LENGTH = 64

// Asynchronous, so hashing runs off the main thread and one sign-in cannot stall every other request.
const derive = promisify(scrypt) as (password: string, salt: string, keyLength: number) => Promise<Buffer>

/** Returns `salt:hash` (both hex), using a fresh random salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await derive(password, salt, KEY_LENGTH)
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  if (expected.length === 0) return false
  const actual = await derive(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}
