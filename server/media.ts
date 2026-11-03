import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
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
