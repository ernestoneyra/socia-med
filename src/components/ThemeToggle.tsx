import { MoonIcon, SunIcon } from '@heroicons/react/20/solid'
import { useTheme } from '../lib/theme.ts'

/**
 * Sun/moon switch. The thumb slides behind whichever icon is active.
 * 44px tall to meet the AAA target size (SC 2.5.5); the track border is >= 3:1 (SC 1.4.11).
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      className="relative h-11 w-20 shrink-0 cursor-pointer rounded-full border border-edge bg-surface-2"
    >
      <span
        aria-hidden="true"
        className={`fc-border absolute left-0.5 top-0.5 size-[38px] rounded-full bg-accent shadow-sm transition-transform duration-200 ${
          dark ? 'translate-x-9' : 'translate-x-0'
        }`}
      />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-between px-0.5">
        <span className={`grid size-[38px] place-items-center ${dark ? 'text-muted' : 'text-accent-ink'}`}>
          <SunIcon className="size-5" />
        </span>
        <span className={`grid size-[38px] place-items-center ${dark ? 'text-accent-ink' : 'text-muted'}`}>
          <MoonIcon className="size-5" />
        </span>
      </span>
    </button>
  )
}
