# socia-med

A social media app for sharing creative work: photographs, recordings, rides and essays. Follow people, explore what they are making, message them and keep track of uploads.

> **Status:** v0.1.0. The UI is built against in-memory sample data (`src/data/`). The Express API only exposes a health check so far, and the pages are not yet wired to MongoDB.

## Features

- **Home**: a feed of recent uploads from the people you follow.
- **Explore**: trending tags and suggested people to follow.
- **Messages**: conversation list and threads, with unread counts.
- **Notifications**: activity feed with an unread badge.
- **Uploads**: all uploads, or those of a single user.
- **Profiles**: bio, interests, follower count and uploads.
- **Light and dark theme**, with a toggle in the header.

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

| Method | Path          | Response                                           |
| ------ | ------------- | -------------------------------------------------- |
| GET    | `/api/health` | `{ "status": "ok", "db": "connected" \| "disconnected" }` |

## Project structure

```
server/            Express API and MongoDB connection
src/
  components/      Header, upload cards, avatars, theme toggle, user menu...
  data/            Types and sample data (users, uploads, messages)
  lib/             Hash router, theme handling, formatting helpers
  pages/           Home, Explore, Messages, Notifications, Uploads, Profile
```

Routing is hash-based (`#/explore`, `#/messages/:id`, `#/uploads/:userId`, `#/u/:id`), implemented in [src/lib/router.ts](src/lib/router.ts).

See [CHANGELOG.md](CHANGELOG.md) for release notes.
