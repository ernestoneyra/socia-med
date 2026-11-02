# socia-med

A social media app for sharing creative work: photographs, recordings, rides and essays. Follow people, explore what they are making, message them and keep track of uploads.

> **Status:** v0.1.0. The app reads and writes MongoDB through the Express API. Run `npm run seed` once to fill an empty database with sample data; after that, changes made directly in MongoDB show up in the app the next time the tab is focused or reloaded.

## Features

- **Home**: a feed of recent uploads from the people you follow.
- **Explore**: trending tags and suggested people to follow.
- **Messages**: conversation list and threads, with unread counts.
- **Notifications**: activity feed with an unread badge.
- **Uploads**: all uploads, or those of a single user.
- **Profiles**: bio, interests, follower count and uploads.
- **Light and dark theme**, with a toggle in the header.
- **Help and accessibility**: an accessibility statement, keyboard help and a glossary.

## Accessibility

The target is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level **AAA**. Where a success criterion has no AAA level, the next level down (AA, then A) applies. Some AAA criteria cannot be met by the app alone; see "Known limits" below. The same text, for users, is on the Help page (`#/help`).

How the main criteria are met:

| Area | What the app does |
| ---- | ----------------- |
| Contrast (1.4.6, 1.4.11) | Text is at least 7:1 in both themes and control borders at least 3:1. The tokens in `src/index.css` are documented; recheck the ratios when you change one. Use `--edge` for control borders and `--line` only for decorative dividers. |
| Focus (2.4.7, 2.4.12, 2.4.13) | A 3px outline with a 2px gap, in the text colour. `scroll-padding-top` keeps focused items out from under the sticky header. Use `focus-visible:-outline-offset-4` for full-width links inside clipped containers. |
| Target size (2.5.5) | Buttons, switches and standalone links are at least 44 by 44 px (`min-h-11 min-w-11`). |
| Navigation (2.4.1, 2.4.2, 2.4.8, 2.4.9, 2.4.10) | Skip link, a title per page (set in `App.tsx`), breadcrumbs, link text that says where it goes, and a heading structure with no skipped levels. After in-app navigation focus moves to the page `<h1>`. |
| Reading (1.4.8, 3.1.3, 3.1.4) | Line height of 1.5 or more (set in the Tailwind theme), paragraph spacing, lines no longer than 80 characters, no abbreviations in visible text, and expandable definitions for jargon (`src/data/glossary.ts`). |
| Time and motion (2.2.2, 2.2.3, 2.3.3) | Nothing changes on a timer. Animation respects `prefers-reduced-motion`. |
| Status and errors (3.3.5, 3.3.6, 4.1.3) | Help text under inputs, live regions for results and sent messages (`Status` component), and "Undo send". |
| User settings (1.4.8, 1.4.12) | Works with forced colours, `prefers-contrast: more`, user text spacing and zoom to 400 per cent (320px wide) without sideways scrolling. |

When you add UI:

- Give every control a visible label that is part of its accessible name. Put extra context in an `sr-only` span after the visible text.
- Write numbers in full (`count()` in `src/lib/format.ts`) and times in words (`ago()`); add new jargon to the glossary.
- Never change content on a timer. Make submissions reversible or confirmable.
- Pass `label` to `Artwork` when it carries meaning; leave it out when it is decoration.

### Known limits

- Pictures, audio and video are generated stand-ins. Real uploads will need an author-written text description, and audio and video need captions, transcripts, audio description and a sign-language version (1.2.x, AAA).
- Text written by users (captions, messages) is not rewritten for reading level (3.1.5) or checked for idioms.
- Automated checks cannot prove AAA. Test with a screen reader and a keyboard before a release.

## Tech stack

- **Client:** React 19, TypeScript, Vite, Tailwind CSS 4, Heroicons, Figtree and Fraunces fonts
- **Server:** Express 5, Mongoose (MongoDB)
- **Tooling:** ESLint, `concurrently`

## Getting started

### Prerequisites

- Node.js 24 or later (the server runs `.ts` files directly and uses `--env-file`)
- A MongoDB database, for example a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set your connection string:

| Variable      | Description                          | Default |
| ------------- | ------------------------------------ | ------- |
| `MONGODB_URI` | MongoDB connection string (required) | none    |
| `PORT`        | Port for the API server              | `5189`  |

### Run

```bash
npm run dev
```

This starts both processes:

- Client: <http://localhost:5188>
- API: <http://localhost:5189>. Vite proxies `/api` to it, so `GET /api/health` also works through the client port.

The server exits on startup if `MONGODB_URI` is missing or the database is unreachable.

## Scripts

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Run the client and the API together           |
| `npm run client`  | Run only the Vite dev server                  |
| `npm run server`  | Run only the Express API                      |
| `npm run build`   | Type-check and build the client into `dist/`  |
| `npm run lint`    | Lint the project                              |
| `npm run preview` | Preview the production build                  |

## API

| Method | Path                                      | Purpose                                                          |
| ------ | ----------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/health`                             | `{ "status": "ok", "db": "connected" \| "disconnected" }`         |
| GET    | `/api/me`                                 | The signed-in user's id (no login yet, so always the seed user)  |
| GET    | `/api/users`                              | All users                                                        |
| GET    | `/api/uploads`                            | All uploads, newest first                                        |
| GET    | `/api/inbox`                              | `{ conversations, notifications }`                               |
| POST   | `/api/conversations/:userId/messages`     | Send a message: body `{ id, text }`                              |
| DELETE | `/api/conversations/:userId/messages/:id` | Unsend one of your own messages                                  |
| POST   | `/api/conversations/:userId/read`         | Mark a conversation, and its message notifications, as read      |
| POST   | `/api/notifications/:id/read`             | Mark one notification as read                                    |
| POST   | `/api/notifications/read-all`             | Mark every notification as read                                  |
| PUT    | `/api/uploads/:id/like`                   | Like an upload. Returns `{ liked, likes }`                       |
| DELETE | `/api/uploads/:id/like`                   | Remove your like                                                 |
| PUT    | `/api/users/:id/follow`                   | Follow someone. Returns `{ following, followers }`               |
| DELETE | `/api/users/:id/follow`                   | Unfollow                                                         |

Every document also gets `createdAt` and `updatedAt` from Mongoose; they are bookkeeping and are not sent to the client. Uploads and notifications keep their own `createdAt` (when the content was posted), and messages their `sentAt`. Times shown in the app ("4 days ago", "Today") come from those stored values and are measured against the current time.

Responses are never cached. Likes and follows are saved in the `likes` and `follows` collections (one document per pair). Repeating a PUT or DELETE changes nothing, and the stored `likes`, `followers` and `following` counts only move when a row is really added or removed.

`npm run seed` upserts every sample document by id, so running it again **overwrites** edits you made to those documents in MongoDB. It also empties `likes` and `follows`, because it resets the counts they are kept in step with.

## Project structure

```
server/            Express API, Mongoose models and MongoDB connection
  seed-data/       Sample data used only by `npm run seed`
src/
  components/      Header, upload cards, avatars, theme toggle, user menu...
  data/            Types, API client, the data store (loads from the API) and the glossary
  lib/             Hash router, theme handling, formatting helpers
  pages/           Home, Explore, Messages, Notifications, Uploads, Profile, Help
```

Routing is hash-based (`#/explore`, `#/messages/:id`, `#/uploads/:userId`, `#/u/:id`, `#/help`), implemented in [src/lib/router.ts](src/lib/router.ts).

See [CHANGELOG.md](CHANGELOG.md) for release notes.
