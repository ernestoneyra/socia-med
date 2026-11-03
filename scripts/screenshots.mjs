// Retakes the README screenshots in docs/screenshots/ from a running app: 1440 x 900, English.
// It only looks: every request that would change data (POST, PUT, PATCH, DELETE) is blocked in the browser, so
// opening a conversation does not mark it as read and nothing in the database changes. The sample data should
// already be in place (`npm run seed`). Start the app, then run this in another terminal:
//   npm run dev        (or: npm run build && npm start)
//   npm run screenshots
// Uses the Chrome that is installed; set CHROME_PATH to point at a specific browser binary instead.
// Set BASE if the app is not at http://localhost:5188 (the dev client).
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE ?? 'http://localhost:5188'
const OUT = fileURLToPath(new URL('../docs/screenshots/', import.meta.url))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
)
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US', colorScheme: 'light' })

// Look, don't touch: the page still updates itself on screen, but the server never hears about it.
await ctx.route('**/api/**', (route) =>
  route.request().method() === 'GET' || route.request().method() === 'HEAD'
    ? route.continue()
    : route.fulfill({ status: 204 }),
)

const shoot = async (route, file, theme = 'light') => {
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`)
  await page.evaluate((t) => localStorage.setItem('theme', t), theme)
  await page.goto(`${BASE}/#/${route}`)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => !/Loading/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(600) // let fonts and transitions settle
  await page.screenshot({ path: `${OUT}${file}.png` })
  await page.close()
  console.log('saved', `docs/screenshots/${file}.png`)
}

await shoot('', 'home')
await shoot('explore', 'explore')
await shoot('messages/maya', 'messages')
await shoot('u/maya', 'profile')
await shoot('help', 'help-dark', 'dark')
await browser.close()
