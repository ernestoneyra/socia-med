/**
 * Says something to screen readers when the element that would have said it is gone (for
 * example the card of a post that was just deleted). One hidden live region lives on the page.
 */
let region: HTMLElement | null = null

export function announce(message: string) {
  if (!region) {
    region = document.createElement('div')
    region.setAttribute('role', 'status')
    region.className = 'sr-only'
    document.body.append(region)
  }
  // Clearing first makes a repeated message announce again.
  region.textContent = ''
  setTimeout(() => {
    if (region) region.textContent = message
  }, 50)
}
