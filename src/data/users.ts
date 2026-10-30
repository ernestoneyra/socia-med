import type { User } from './types.ts'

export const ME_ID = 'ernesto'

export const users: User[] = [
  {
    id: 'ernesto',
    name: 'Ernesto Neyra',
    handle: 'ernesto',
    bio: 'Building small, kind corners of the internet. Weekend film shooter, daily coffee nerd.',
    location: 'Miami, FL',
    joined: '2026-01-14',
    interests: ['web dev', 'film photography', 'coffee'],
    followers: 214,
    following: 96,
    hue: 24,
  },
  {
    id: 'maya',
    name: 'Maya Okafor',
    handle: 'mayaokafor',
    bio: 'Street and portrait photographer shooting 35mm. Lagos born, Lisbon based. I develop my own rolls in the bathroom.',
    location: 'Lisbon, Portugal',
    joined: '2025-11-02',
    interests: ['35mm film', 'portraits', 'darkroom'],
    followers: 5820,
    following: 312,
    hue: 12,
  },
  {
    id: 'tomas',
    name: 'Tomás Lindqvist',
    handle: 'tomaslind',
    bio: 'Field recordist. I collect the sound of places before they change: harbours, markets, thawing lakes.',
    location: 'Gothenburg, Sweden',
    joined: '2025-12-09',
    interests: ['field recording', 'ambient', 'hydrophones'],
    followers: 2140,
    following: 188,
    hue: 200,
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    handle: 'priyaraman',
    bio: 'Ceramicist and part-time essayist. Wobbly bowls, honest glazes, long walks that become paragraphs.',
    location: 'Bengaluru, India',
    joined: '2026-02-21',
    interests: ['ceramics', 'essays', 'slow living'],
    followers: 3377,
    following: 241,
    hue: 150,
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    handle: 'jonasweber',
    bio: 'Bike mechanic who films long rides. Gravel, night trains, and the occasional unplanned swim.',
    location: 'Leipzig, Germany',
    joined: '2026-03-30',
    interests: ['gravel riding', 'bikepacking', 'short film'],
    followers: 1290,
    following: 407,
    hue: 95,
  },
  {
    id: 'sol',
    name: 'Sol Herrera',
    handle: 'solherrera',
    bio: 'Illustrator making risograph zines about cities and the people who keep them running at 4 a.m.',
    location: 'Mexico City, Mexico',
    joined: '2025-09-18',
    interests: ['risograph', 'zines', 'illustration'],
    followers: 8964,
    following: 523,
    hue: 320,
  },
]

export const me = users[0]
export const otherUsers = users.slice(1)

export function findUser(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getUser(id: string): User {
  const user = findUser(id)
  if (!user) throw new Error(`Unknown user: ${id}`)
  return user
}
