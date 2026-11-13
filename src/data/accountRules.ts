import { m, type Msg } from '../i18n/core.ts'

/** What makes a new account valid. Shared, so the form and the server agree. */

export const MAX_NAME = 60
export const MIN_USERNAME = 3
export const MAX_USERNAME = 30
export const MIN_PASSWORD = 8
/** Passwords are hashed with a deliberately slow function, so the length must be bounded. */
export const MAX_PASSWORD = 128

/** Lowercase letters and digits, with dots, dashes and underscores allowed after the first character. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/

/** Usernames are not case sensitive: "Jane.Doe " and "jane.doe" are the same account. */
export const normalizeUsername = (username: string) => username.trim().toLowerCase()

/** "  Jane   Doe " -> "Jane Doe" */
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ')

export interface RegisterInput {
  name: string
  username: string
  password: string
}

export type RegisterErrors = Partial<Record<keyof RegisterInput, Msg>>

export function validateRegistration({ name, username, password }: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {}

  const cleanName = normalizeName(name)
  if (!cleanName) errors.name = m('rule.nameRequired')
  else if (cleanName.length > MAX_NAME) errors.name = m('rule.nameTooLong', { max: MAX_NAME })

  const cleanUsername = normalizeUsername(username)
  if (!cleanUsername) errors.username = m('rule.usernameRequired')
  else if (
    cleanUsername.length < MIN_USERNAME ||
    cleanUsername.length > MAX_USERNAME ||
    !USERNAME_PATTERN.test(cleanUsername)
  ) {
    errors.username = m('rule.usernameInvalid', { min: MIN_USERNAME, max: MAX_USERNAME })
  }

  if (!password) errors.password = m('rule.passwordRequired')
  else if (password.length < MIN_PASSWORD) errors.password = m('rule.passwordTooShort', { min: MIN_PASSWORD })
  else if (password.length > MAX_PASSWORD) errors.password = m('rule.passwordTooLong', { max: MAX_PASSWORD })

  return errors
}
