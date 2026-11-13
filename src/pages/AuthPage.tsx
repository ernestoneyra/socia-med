import { useId, useRef, useState, type FormEvent } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import FieldError from '../components/FieldError.tsx'
import PageHeading from '../components/PageHeading.tsx'
import Status from '../components/Status.tsx'
import {
  MAX_NAME,
  MAX_PASSWORD,
  MAX_USERNAME,
  MIN_PASSWORD,
  validateRegistration,
  type RegisterErrors,
} from '../data/accountRules.ts'
import { ApiError } from '../data/api.ts'
import { createAccount, signIn } from '../data/store.ts'
import { m, type Msg } from '../i18n/core.ts'
import { useT } from '../i18n/useT.tsx'
import { fieldClass } from '../lib/formStyles.ts'
import { paths } from '../lib/router.ts'

type Field = 'name' | 'username' | 'password'

/**
 * What to tell the person when a request failed. The answers the server gives most often are
 * written here, in the page's language; any other message the server wrote for people is shown as it is.
 */
function explain(err: unknown): Msg | string {
  if (err instanceof ApiError) {
    if (err.status === 401) return m('auth.wrongCredentials')
    if (err.status === 409) return m('auth.usernameTaken')
    if (err.status === 429) return m('auth.tooMany')
    if (err.status >= 400 && err.status < 500 && err.detail) return err.detail
  }
  return m('auth.unreachable')
}

/**
 * Shown instead of the app while nobody is signed in. Signing in and creating an account are
 * two routes of the same page, so each has its own address and the browser's back button works.
 */
export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const t = useT()
  const uid = useId()
  const registering = mode === 'register'
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [formError, setFormError] = useState<Msg | string>('')
  const [submitting, setSubmitting] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const id = (part: string) => `${uid}-${part}`
  const describedBy = (field: Field, hint?: boolean) =>
    [errors[field] ? id(`${field}-error`) : '', hint ? id(`${field}-hint`) : ''].filter(Boolean).join(' ') || undefined

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setFormError('')

    // Creating an account checks the same rules as the server, so most mistakes never leave the page.
    // Signing in only needs both fields filled: the server says whether they match an account.
    const found: RegisterErrors = registering
      ? validateRegistration({ name, username, password })
      : {
          ...(username.trim() ? {} : { username: m('auth.enterUsername') }),
          ...(password ? {} : { password: m('auth.enterPassword') }),
        }
    setErrors(found)
    const fields = (['name', 'username', 'password'] as const).filter((f) => found[f])
    if (fields.length) {
      setAnnouncement(t('count.problems', { n: fields.length }))
      // Take the person to the first problem (SC 3.3.1).
      formRef.current?.querySelector<HTMLElement>(`[name="${fields[0]}"]`)?.focus()
      return
    }

    setSubmitting(true)
    setAnnouncement(registering ? t('auth.creating') : t('auth.signingIn'))
    try {
      // On success the app swaps this page for the signed-in one, so there is nothing more to do here.
      if (registering) await createAccount(name, username, password)
      else await signIn(username, password)
    } catch (err) {
      setSubmitting(false)
      const message = explain(err)
      if (registering && err instanceof ApiError && err.status === 409) {
        // The one mistake only the server can know about: someone already has that username.
        setErrors({ username: m('auth.usernameTaken') })
        setAnnouncement(t('auth.usernameTaken'))
        formRef.current?.querySelector<HTMLElement>('[name="username"]')?.focus()
      } else {
        setFormError(message)
        setAnnouncement(t.msg(message))
      }
    }
  }

  const invalid = (field: Field) => (errors[field] ? ('true' as const) : undefined)

  return (
    <div className="mx-auto w-full max-w-md">
      <PageHeading
        title={registering ? t('auth.registerTitle') : t('auth.loginTitle')}
        subtitle={registering ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
      />
      <Status>{announcement}</Status>

      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6"
      >
        {registering && (
          <div>
            <label htmlFor={id('name')} className="block text-sm font-medium">
              {t('auth.name')}
            </label>
            <input
              id={id('name')}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={invalid('name')}
              aria-describedby={describedBy('name')}
              className={fieldClass(!!errors.name)}
            />
            <FieldError id={id('name-error')}>{errors.name}</FieldError>
          </div>
        )}

        <div>
          <label htmlFor={id('username')} className="block text-sm font-medium">
            {t('auth.username')}
          </label>
          {registering && (
            <p id={id('username-hint')} className="text-sm text-muted">
              {t('auth.usernameHint')}
            </p>
          )}
          <input
            id={id('username')}
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={MAX_USERNAME}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            aria-required="true"
            aria-invalid={invalid('username')}
            aria-describedby={describedBy('username', registering)}
            className={fieldClass(!!errors.username)}
          />
          <FieldError id={id('username-error')}>{errors.username}</FieldError>
        </div>

        <div>
          <label htmlFor={id('password')} className="block text-sm font-medium">
            {t('auth.password')}
          </label>
          {registering && (
            <p id={id('password-hint')} className="text-sm text-muted">
              {t('auth.passwordHint', { n: MIN_PASSWORD })}
            </p>
          )}
          <input
            id={id('password')}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={MAX_PASSWORD}
            autoComplete={registering ? 'new-password' : 'current-password'}
            required
            aria-required="true"
            aria-invalid={invalid('password')}
            aria-describedby={describedBy('password', registering)}
            className={fieldClass(!!errors.password)}
          />
          <FieldError id={id('password-error')}>{errors.password}</FieldError>
        </div>

        {formError && (
          <p role="alert" className="flex items-start gap-1.5 rounded-xl border-2 border-accent px-4 py-3 text-sm font-medium">
            <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.msg(formError)}
          </p>
        )}

        <button
          type="submit"
          aria-disabled={submitting}
          className="fc-border inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {submitting
            ? registering
              ? t('auth.creatingShort')
              : t('auth.signingIn')
            : registering
              ? t('auth.createAccount')
              : t('auth.signIn')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {registering ? t('auth.haveAccount') : t('auth.newHere')}{' '}
        <a
          href={registering ? paths.login : paths.register}
          className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
        >
          {registering ? t('auth.signIn') : t('auth.createAnAccount')}
        </a>
      </p>
    </div>
  )
}
