/** The look of a text field; a field with a problem gets a heavier accent border, not only a colour. */
export const fieldClass = (invalid: boolean) =>
  `mt-1 block min-h-11 w-full rounded-xl border bg-paper px-4 py-2 text-base placeholder:text-muted focus-visible:outline-offset-0 ${
    invalid ? 'border-2 border-accent' : 'border-edge'
  }`
