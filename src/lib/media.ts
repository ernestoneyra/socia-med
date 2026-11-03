const pad = (n: number) => String(n).padStart(2, '0')

/** 222 -> "3:42", 3723 -> "1:02:03". */
export function clockFromSeconds(total: number): string {
  const s = Math.round(total)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/**
 * Reads how long an audio or video file is from the file itself, so nobody has to type it.
 * Resolves to undefined if the browser cannot tell (an unusual codec, a stream with no length).
 */
export function readDuration(file: File, kind: 'audio' | 'video'): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement(kind)
    let done = false
    const finish = (value: string | undefined) => {
      if (done) return
      done = true
      clearTimeout(timer)
      el.removeAttribute('src')
      el.load()
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(() => finish(undefined), 8000)
    el.preload = 'metadata'
    el.onloadedmetadata = () =>
      finish(Number.isFinite(el.duration) && el.duration > 0 ? clockFromSeconds(el.duration) : undefined)
    el.onerror = () => finish(undefined)
    el.src = url
  })
}
