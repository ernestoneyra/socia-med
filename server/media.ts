import { randomUUID } from 'node:crypto'
import { mkdir, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Attached photos, audio and video live on disk here and are served from `/media`. */
export const MEDIA_DIR = join(import.meta.dirname, 'media')
export const MEDIA_URL_PREFIX = '/media/'

/** Stores a file under a name the server picks, so nothing from the upload decides the path. */
export async function saveMedia(data: Buffer, extension: string): Promise<string> {
  await mkdir(MEDIA_DIR, { recursive: true })
  const name = `${randomUUID()}.${extension}`
  await writeFile(join(MEDIA_DIR, name), data)
  return `${MEDIA_URL_PREFIX}${name}`
}

/** Only URLs this server handed out: `/media/<uuid>.<extension>`. */
export const MEDIA_URL_PATTERN = /^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.([a-z0-9]{2,4})$/

/** Removes one stored file, given its `/media/...` URL. Missing files are fine. */
export async function deleteMedia(url: string | undefined): Promise<void> {
  if (!url || !MEDIA_URL_PATTERN.test(url)) return
  try {
    await unlink(join(MEDIA_DIR, url.slice(MEDIA_URL_PREFIX.length)))
  } catch (err) {
    if ((err as { code?: string }).code !== 'ENOENT') throw err
  }
}

/** Removes every stored file (used when the demo resets). */
export async function clearMedia(): Promise<number> {
  const names = await readdir(MEDIA_DIR).catch(() => [] as string[])
  await Promise.all(names.map((n) => rm(join(MEDIA_DIR, n), { force: true })))
  return names.length
}
