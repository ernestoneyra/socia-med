import type { Upload } from './types.ts'

// Newest first.
export const uploads: Upload[] = [
  {
    id: 'u1',
    userId: 'maya',
    kind: 'photo',
    title: 'Tram 28, last light',
    caption:
      'Kodak Portra 400, pushed one stop. The tram was nearly empty and the whole carriage turned orange for about ninety seconds.',
    createdAt: '2026-10-29T18:42:00',
    likes: 482,
    comments: 37,
    tags: ['35mm', 'lisbon', 'portra400'],
    seed: 11,
  },
  {
    id: 'u2',
    userId: 'tomas',
    kind: 'audio',
    title: 'Hammarkullen market, 7:10 a.m.',
    caption:
      'Crates being unloaded, a radio somewhere playing Arabic pop, and a vendor singing off-key. Recorded with a pair of omnis taped to a lamppost.',
    createdAt: '2026-10-29T09:05:00',
    likes: 231,
    comments: 18,
    tags: ['fieldrecording', 'gothenburg'],
    seed: 23,
    duration: '12:48',
  },
  {
    id: 'u3',
    userId: 'sol',
    kind: 'photo',
    title: 'Zine 07: Night Shift (cover)',
    caption:
      'Three-colour riso: fluorescent pink, teal and a bit of black. Printed 200 copies on my friend’s machine and it jammed only twice.',
    createdAt: '2026-10-28T20:15:00',
    likes: 1204,
    comments: 96,
    tags: ['risograph', 'zine', 'cdmx'],
    seed: 34,
  },
  {
    id: 'u4',
    userId: 'priya',
    kind: 'writing',
    title: 'On making a bowl the same way forty times',
    caption:
      'Repetition is not boredom. By the thirtieth bowl my hands knew something my head kept arguing with. A short essay about practice and patience.',
    createdAt: '2026-10-27T16:30:00',
    likes: 689,
    comments: 54,
    tags: ['essay', 'ceramics'],
    seed: 45,
  },
  {
    id: 'u5',
    userId: 'jonas',
    kind: 'video',
    title: 'Harz in the fog: 94 km of gravel',
    caption:
      'Left at 5 a.m., could not see more than twenty metres until the descent into Wernigerode. Worth every cold finger.',
    createdAt: '2026-10-26T11:20:00',
    likes: 357,
    comments: 29,
    tags: ['gravel', 'bikepacking', 'harz'],
    seed: 56,
    duration: '8:03',
  },
  {
    id: 'u6',
    userId: 'ernesto',
    kind: 'photo',
    title: 'Morning ristretto',
    caption: 'Testing the new lens on the most boring subject I own. It did not stay boring.',
    createdAt: '2026-10-25T08:12:00',
    likes: 73,
    comments: 9,
    tags: ['coffee', 'macro'],
    seed: 67,
  },
  {
    id: 'u7',
    userId: 'maya',
    kind: 'photo',
    title: 'Bathroom darkroom setup',
    caption:
      'Yes, that is a shower curtain and a $9 safelight. Yes, the prints still came out sharp. Ask me anything about developing at home.',
    createdAt: '2026-10-24T21:48:00',
    likes: 915,
    comments: 120,
    tags: ['darkroom', 'diy'],
    seed: 78,
  },
  {
    id: 'u8',
    userId: 'tomas',
    kind: 'audio',
    title: 'Lake Delsjön thawing',
    caption:
      'Hydrophone under the ice. The cracking sounds like someone slowly folding a sheet of glass. Headphones strongly recommended.',
    createdAt: '2026-10-22T07:40:00',
    likes: 540,
    comments: 41,
    tags: ['hydrophone', 'ambient'],
    seed: 89,
    duration: '21:15',
  },
  {
    id: 'u9',
    userId: 'sol',
    kind: 'writing',
    title: 'A short guide to selling zines at a book fair',
    caption:
      'Bring a float, bring tape, bring a friend who is better at small talk than you. Everything else is optional.',
    createdAt: '2026-10-20T13:05:00',
    likes: 402,
    comments: 63,
    tags: ['zine', 'tips'],
    seed: 90,
  },
  {
    id: 'u10',
    userId: 'priya',
    kind: 'photo',
    title: 'Celadon test tiles, batch 12',
    caption:
      'Iron content too high again. The one on the far right is my favourite mistake: it looks like rain on a pond.',
    createdAt: '2026-10-18T10:22:00',
    likes: 566,
    comments: 33,
    tags: ['glaze', 'ceramics', 'celadon'],
    seed: 101,
  },
  {
    id: 'u11',
    userId: 'jonas',
    kind: 'photo',
    title: 'Flat tyre, best view',
    caption: 'If you have to fix a puncture, do it somewhere with a lake. That is the whole tip.',
    createdAt: '2026-10-15T15:50:00',
    likes: 188,
    comments: 12,
    tags: ['bikepacking', 'lake'],
    seed: 112,
  },
]

export function getUploadsBy(userId: string): Upload[] {
  return uploads.filter((u) => u.userId === userId)
}

export function getUpload(id: string): Upload | undefined {
  return uploads.find((u) => u.id === id)
}
