import { MoonIcon, SunIcon } from '@heroicons/react/20/solid'
import { useTheme } from '../lib/theme.ts'

/** Sun/moon switch. The thumb slides behind whichever icon is active. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className="relative h-8 w-16 shrink-0 cursor-pointer rounded-full border border-line bg-surface-2"
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 size-[26px] rounded-full bg-accent shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
          dark ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-between px-0.5">
        <span className={`grid size-[26px] place-items-center ${dark ? 'text-muted' : 'text-accent-ink'}`}>
          <SunIcon className="size-[18px]" />
        </span>
        <span className={`grid size-[26px] place-items-center ${dark ? 'text-accent-ink' : 'text-muted'}`}>
          <MoonIcon className="size-[18px]" />
        </span>
      </span>
    </button>
  )
}
