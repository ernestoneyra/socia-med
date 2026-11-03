import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'explore' }
  | { name: 'messages'; id?: string }
  | { name: 'notifications' }
  | { name: 'uploads'; id?: string }
  | { name: 'profile'; id: string }
  | { name: 'help' }

export const paths = {
  home: '#/',
  explore: '#/explore',
  messages: (id?: string) => (id ? `#/messages/${id}` : '#/messages'),
  notifications: '#/notifications',
  uploads: (userId?: string) => (userId ? `#/uploads/${userId}` : '#/uploads'),
  profile: (id: string) => `#/u/${id}`,
  help: '#/help',
}

function parse(hash: string): Route {
  const [, section = '', id] = hash.replace(/^#/, '').split('/')
  switch (section) {
    case 'explore':
      return { name: 'explore' }
    case 'messages':
      return { name: 'messages', id }
    case 'notifications':
      return { name: 'notifications' }
    case 'uploads':
      return { name: 'uploads', id }
    case 'help':
      return { name: 'help' }
    case 'u':
      return id ? { name: 'profile', id } : { name: 'home' }
    default:
      return { name: 'home' }
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

export function useRoute(): Route {
  // parse() returns a fresh object, so subscribe to the string and parse after.
  return parse(useSyncExternalStore(subscribe, getHash))
}
