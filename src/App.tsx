import { useEffect } from 'react'
import Header from './components/Header.tsx'
import { useRoute } from './lib/router.ts'
import ExplorePage from './pages/ExplorePage.tsx'
import HomePage from './pages/HomePage.tsx'
import MessagesPage from './pages/MessagesPage.tsx'
import NotificationsPage from './pages/NotificationsPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import UploadsPage from './pages/UploadsPage.tsx'

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
    default:
      return <HomePage />
  }
}

export default function App() {
  const route = useRoute()
  const routeKey = 'id' in route ? `${route.name}/${route.id}` : route.name

  // Hash navigation doesn't reset scroll the way a page load does.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [routeKey])

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Page />
      </main>
    </>
  )
}
