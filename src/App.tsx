import { useEffect, useRef } from 'react'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import SkipLink from './components/SkipLink.tsx'
import { loadData, retryLoad, startAutoRefresh, useDataState, type Data } from './data/store.ts'
import { useT, type T } from './i18n/useT.tsx'
import { paths, useRoute, type Route } from './lib/router.ts'
import AuthPage from './pages/AuthPage.tsx'
import ExplorePage from './pages/ExplorePage.tsx'
import HelpPage from './pages/HelpPage.tsx'
import HomePage from './pages/HomePage.tsx'
import MessagesPage from './pages/MessagesPage.tsx'
import NotificationsPage from './pages/NotificationsPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import UploadsPage from './pages/UploadsPage.tsx'

const SITE = 'socia-med'

function Page() {
  const route = useRoute()

  switch (route.name) {
    case 'explore':
      return <ExplorePage />
    case 'messages':
      return <MessagesPage activeId={route.id} />
    case 'notifications':
      return <NotificationsPage />
    case 'uploads':
      return <UploadsPage key={route.id ?? 'all'} userId={route.id} />
    case 'profile':
      return <ProfilePage userId={route.id} />
    case 'help':
      return <HelpPage />
    // The sign-in and sign-up addresses mean nothing once signed in; App sends you home from them.
    default:
      return <HomePage />
  }
}

/** Every page gets its own title (WCAG 2.4.2), most specific part first. */
function pageTitle(route: Route, { findUser }: Data, t: T): string {
  switch (route.name) {
    case 'explore':
      return t('nav.explore')
    case 'messages': {
      const other = route.id ? findUser(route.id) : undefined
      return other ? t('title.messagesWith', { name: other.name }) : t('nav.messages')
    }
    case 'notifications':
      return t('nav.notifications')
    case 'uploads': {
      const owner = route.id ? findUser(route.id) : undefined
      return owner ? t('title.uploadsBy', { name: owner.name }) : t('nav.uploads')
    }
    case 'profile':
      return findUser(route.id)?.name ?? t('title.profileNotFound')
    case 'help':
      return t('title.help')
    case 'login':
      return t('title.signIn')
    case 'register':
      return t('title.createAccount')
    default:
      return t('nav.home')
  }
}

/** Shown until the first read from the server finishes, or if it fails. */
function LoadState({
  state,
}: {
  state: Exclude<ReturnType<typeof useDataState>, { status: 'ready' | 'signed-out' }>
}) {
  const t = useT()
  if (state.status === 'loading') {
    return (
      <p role="status" className="py-16 text-center text-muted">
        {t('common.loading')}
      </p>
    )
  }
  return (
    <div role="alert" className="mx-auto max-w-prose rounded-2xl border border-edge px-6 py-12 text-center">
      <h1 tabIndex={-1} className="font-display text-2xl font-semibold">
        {t('load.failedTitle')}
      </h1>
      <p className="mt-3 text-muted">
        {t('load.failedBody')}
      </p>
      <p className="mt-3 break-words text-sm text-muted">{state.message}</p>
      <button
        type="button"
        onClick={() => void retryLoad()}
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover"
      >
        {t('load.tryAgain')}
      </button>
    </div>
  )
}

export default function App() {
  const t = useT()
  const route = useRoute()
  const state = useDataState()
  const data = state.status === 'ready' ? state.data : null
  const routeKey = 'id' in route ? `${route.name}/${route.id}` : route.name
  // Choosing another conversation should leave focus on the list you just used.
  const focusKey = route.name === 'messages' ? 'messages' : routeKey
  const authMode = route.name === 'register' ? 'register' : 'login'
  const title = data
    ? pageTitle(route, data, t)
    : state.status === 'signed-out'
      ? authMode === 'register'
        ? t('title.createAccount')
        : t('title.signIn')
      : state.status === 'loading'
        ? t('title.loading')
        : t('title.error')
  const lastFocusKey = useRef<string | null>(null)
  const lastStatus = useRef(state.status)
  const sawSignedOut = useRef(false)

  useEffect(() => {
    document.title = `${title} · ${SITE}`
  }, [title])

  // Read from the database on start, and again whenever the tab is focused, so changes made
  // elsewhere (for example directly in MongoDB) show up without reloading.
  useEffect(() => {
    void loadData()
    return startAutoRefresh()
  }, [])

  // Once signed in, #/login and #/register have nothing to show: go to the home page instead.
  const onAuthRoute = route.name === 'login' || route.name === 'register'
  useEffect(() => {
    if (state.status === 'ready' && onAuthRoute) window.location.replace(paths.home)
  }, [state.status, onAuthRoute])

  // Signing in or out swaps the whole screen, so the button that had focus is gone. Put focus on the
  // new screen's heading (SC 2.4.3). Not on the very first load, where the browser starts at the top itself.
  useEffect(() => {
    const previous = lastStatus.current
    lastStatus.current = state.status
    if (state.status === 'signed-out') sawSignedOut.current = true
    const leftTheApp = state.status === 'signed-out' && previous === 'ready'
    const enteredTheApp = state.status === 'ready' && sawSignedOut.current
    if (state.status === 'ready') sawSignedOut.current = false
    if (!leftTheApp && !enteredTheApp) return
    const target = document.querySelector<HTMLElement>('main h1') ?? document.getElementById('main-content')
    target?.focus({ preventScroll: true })
  }, [state.status])

  // Hash navigation doesn't reset scroll the way a page load does.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [routeKey])

  // A full page load starts at the top and announces the title itself. After in-app navigation
  // nothing would tell a screen reader the page changed, so move focus to the new page's heading
  // (WCAG 2.4.3, 4.1.3). The ref keeps this off the very first render, including StrictMode's repeat.
  useEffect(() => {
    const previous = lastFocusKey.current
    lastFocusKey.current = focusKey
    if (previous === null || previous === focusKey) return
    const target = document.querySelector<HTMLElement>('main h1') ?? document.getElementById('main-content')
    target?.focus({ preventScroll: true })
  }, [focusKey])

  return (
    <>
      <SkipLink />
      {data && <Header />}
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {state.status === 'ready' ? (
          <Page />
        ) : state.status === 'signed-out' ? (
          <AuthPage key={authMode} mode={authMode} />
        ) : (
          <LoadState state={state} />
        )}
      </main>
      <Footer />
    </>
  )
}
