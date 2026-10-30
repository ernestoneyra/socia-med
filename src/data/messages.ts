import { ME_ID } from './users.ts'
import type { Conversation, Notification } from './types.ts'

const me = ME_ID

// Most recently active conversation first.
export const conversations: Conversation[] = [
  {
    userId: 'maya',
    unread: 2,
    messages: [
      { id: 'm1', from: me, sentAt: '2026-10-29T19:02:00', text: 'That tram shot is unreal. Did you meter for the shadows or the windows?' },
      { id: 'm2', from: 'maya', sentAt: '2026-10-29T19:10:00', text: 'Windows, then I let the rest fall where it wanted. Portra forgives a lot.' },
      { id: 'm3', from: 'maya', sentAt: '2026-10-29T19:11:00', text: 'You should come to the next walk. We are meeting in Alfama on Saturday!' },
    ],
  },
  {
    userId: 'sol',
    unread: 1,
    messages: [
      { id: 'm4', from: 'sol', sentAt: '2026-10-28T21:30:00', text: 'Saved you a copy of Night Shift. Where should I post it?' },
      { id: 'm5', from: me, sentAt: '2026-10-28T21:44:00', text: 'You are the best. Miami address coming in a sec.' },
      { id: 'm6', from: 'sol', sentAt: '2026-10-28T21:50:00', text: 'Also, would you let me borrow your colour palette for the next cover? 👀' },
    ],
  },
  {
    userId: 'tomas',
    unread: 0,
    messages: [
      { id: 'm7', from: 'tomas', sentAt: '2026-10-27T08:15:00', text: 'Finally uploaded the market recording. Took me a week to clean the wind noise.' },
      { id: 'm8', from: me, sentAt: '2026-10-27T12:02:00', text: 'Listening on the train. The singing vendor made my whole commute.' },
      { id: 'm9', from: 'tomas', sentAt: '2026-10-27T12:30:00', text: 'He does that every Thursday. I think he knows I am there.' },
      { id: 'm10', from: me, sentAt: '2026-10-27T12:41:00', text: 'Ha. Do not tell him, he will stop.' },
    ],
  },
  {
    userId: 'priya',
    unread: 0,
    messages: [
      { id: 'm11', from: me, sentAt: '2026-10-26T17:20:00', text: 'Your essay about repetition is going to stay with me for a while.' },
      { id: 'm12', from: 'priya', sentAt: '2026-10-26T18:05:00', text: 'That means a lot. I almost did not post it. It felt too quiet.' },
      { id: 'm13', from: me, sentAt: '2026-10-26T18:09:00', text: 'Quiet is the point. Post the next one too.' },
    ],
  },
  {
    userId: 'jonas',
    unread: 0,
    messages: [
      { id: 'm14', from: 'jonas', sentAt: '2026-10-24T10:00:00', text: 'Still on for the gravel loop in spring? I found a route with two bakeries.' },
      { id: 'm15', from: me, sentAt: '2026-10-24T10:25:00', text: 'Two bakeries is the only requirement. I will bring the spare tube.' },
    ],
  },
]

// Newest first.
export const notifications: Notification[] = [
  { id: 'n1', type: 'like', actorId: 'maya', uploadId: 'u6', createdAt: '2026-10-29T20:15:00', read: false },
  { id: 'n4', type: 'message', actorId: 'maya', text: 'You should come to the next walk…', createdAt: '2026-10-29T19:11:00', read: false },
  { id: 'n2', type: 'comment', actorId: 'sol', uploadId: 'u6', text: 'The crema on that ristretto is criminal.', createdAt: '2026-10-29T18:03:00', read: false },
  { id: 'n3', type: 'follow', actorId: 'jonas', createdAt: '2026-10-29T14:40:00', read: false },
  { id: 'n5', type: 'upload', actorId: 'tomas', uploadId: 'u2', createdAt: '2026-10-29T09:05:00', read: true },
  { id: 'n7', type: 'upload', actorId: 'sol', uploadId: 'u3', createdAt: '2026-10-28T20:15:00', read: true },
  { id: 'n6', type: 'like', actorId: 'priya', uploadId: 'u6', createdAt: '2026-10-27T11:12:00', read: true },
  { id: 'n8', type: 'follow', actorId: 'priya', createdAt: '2026-10-25T09:30:00', read: true },
]

export function unreadMessageCount(list: Conversation[] = conversations): number {
  return list.reduce((sum, c) => sum + c.unread, 0)
}

export function unreadNotificationCount(): number {
  return notifications.filter((n) => !n.read).length
}
