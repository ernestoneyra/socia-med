import { useEffect, useRef } from 'react'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import SkipLink from './components/SkipLink.tsx'
import { loadData, retryLoad, startAutoRefresh, useDataState, type Data } from './data/store.ts'
import { useRoute, type Route } from './lib/router.ts'
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
    default:
      return <HomePage />
  }
}

/** Every page gets its own title (WCAG 2.4.2), most specific part first. */
function pageTitle(route: Route, { findUser }: Data): string {
  switch (route.name) {
    case 'explore':
      return 'Explore'
    case 'messages': {
      const other = route.id ? findUser(route.id) : undefined
      return other ? `Messages with ${other.name}` : 'Messages'
    }
    case 'notifications':
      return 'Notifications'
    case 'uploads': {
      const owner = route.id ? findUser(route.id) : undefined
      return owner ? `Uploads by ${owner.name}` : 'Uploads'
    }
    case 'profile':
      return findUser(route.id)?.name ?? 'Profile not found'
    case 'help':
      return 'Help and accessibility'
    default:
      return 'Home'
  }
}

/** Shown until the first read from the server finishes, or if it fails. */
function LoadState({ state }: { state: Exclude<ReturnType<typeof useDataState>, { status: 'ready' }> }) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="py-16 text-center text-muted">
        Loading…
      </p>
    )
  }
  return (
    <div role="alert" className="mx-auto max-w-prose rounded-2xl border border-edge px-6 py-12 text-center">
      <h1 tabIndex={-1} className="font-display text-2xl font-semibold">
        Couldn’t load your data
      </h1>
      <p className="mt-3 text-muted">
        The server or the database didn’t answer. Check that the API is running, then try again.
      </p>
      <p className="mt-3 break-words text-sm text-muted">{state.message}</p>
      <button
        type="button"
        onClick={() => void retryLoad()}
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  const state = useDataState()
  const data = state.status === 'ready' ? state.data : null
  const routeKey = 'id' in route ? `${route.name}/${route.id}` : route.name
  // Choosing another conversation should leave focus on the list you just used.
  const focusKey = route.name === 'messages' ? 'messages' : routeKey
  const title = data ? pageTitle(route, data) : state.status === 'loading' ? 'Loading' : 'Error'
  const lastFocusKey = useRef<string | null>(null)

  useEffect(() => {
    document.title = `${title} · ${SITE}`
  }, [title])

  // Read from the database on start, and again whenever the tab is focused, so changes made
  // elsewhere (for example directly in MongoDB) show up without reloading.
  useEffect(() => {
    void loadData()
    return startAutoRefresh()
  }, [])

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
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {state.status === 'ready' ? <Page /> : <LoadState state={state} />}
      </main>
      <Footer />
    </>
  )
}
