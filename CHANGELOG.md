# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A "Try it" section in the README with a link to the live demo, and screenshots of the main pages in `docs/screenshots/`.
- `npm run screenshots` retakes those screenshots from a running app. It blocks every request that would change data, so it can be pointed at a database you care about. Adds `playwright-core` as a dev dependency.

## [0.2.0] - 2026-11-03

### Added

- `npm run seed` fills the database with the sample data, and `npm start` runs the server without a `.env` file (for hosting). Node.js 24 or later is now declared in `engines`.
- A live demo can be deployed to Render with `render.yaml`: one service serves the API and the built client, `npm start` runs it, and `DEMO_RESET_HOURS` restores the sample data on a schedule. Writes are rate limited.
- Edit and delete your own posts: buttons on your posts open an edit modal and a delete confirmation (`PATCH` and `DELETE /api/uploads/:id`). Deleting also removes the post's file, likes and notifications.
- Create post: a button on your own profile opens a modal for photo, audio, video and writing posts. Photos, audio and video are attached as files (the length of audio and video is read from the file), and posts are saved with `POST /api/media` and `POST /api/uploads`.
- The app now reads from MongoDB through the API: `GET /api/me`, `/api/users`, `/api/uploads` and `/api/inbox`. Edits made directly in the database show up on the next focus or reload.
- Sending and unsending messages, and marking conversations and notifications as read, are saved to the database.
- Likes and follows are saved: new `likes` and `follows` collections and `PUT`/`DELETE` endpoints for `/api/uploads/:id/like` and `/api/users/:id/follow`. Counts update on screen straight away and stay in step with the database.
- Every document records when it was last changed (`updatedAt`), and users, conversations, likes and follows also when they were created (`createdAt`). MongoDB writes these on every insert and update; the API never sets them by hand.
- Loading and error states (with a "Try again" button) for when the data can't be fetched.
- Accessibility to WCAG 2.2 level AAA, and the next level down where a rule has no AAA level (see "Accessibility" in the README).
- Skip link, per-page document titles, and focus moved to the new page heading after navigation.
- Help and accessibility page (`#/help`) with an accessibility statement, keyboard help and a glossary, linked from a footer on every page.
- Glossary mechanism: jargon and abbreviations in captions, titles and bios open an in-place definition.
- Breadcrumbs on profiles and per-user uploads.
- "Mark all as read" on Notifications, and "Undo send" for the last message sent.
- Status announcements for search results, filters and sent messages.
- Support for `prefers-reduced-motion`, `prefers-contrast: more` and forced colours (Windows high contrast).

### Changed

- Relative times ("2 hours ago", "Today", "Yesterday") are measured against the real current time instead of a fixed date in October 2026.
- `npm run seed` now updates fields in place instead of replacing whole documents, so re-seeding keeps `createdAt`.
- The sample data moved from `src/data/` to `server/seed-data/` and is only used by `npm run seed`.
- Colour tokens re-tuned: all text is at least 7:1 against its background and control borders at least 3:1, in both themes. The accent colour is darker in the light theme. A new `--edge` token is used for control borders; `--line` is for decorative dividers only.
- Visible focus is now a 3px outline with a gap, and nothing hides under the sticky header.
- Every button, switch and standalone link is at least 44 by 44 pixels.
- Line height is 1.5 or more everywhere; captions and bios are no longer cut off after three lines; long names wrap instead of truncating.
- Numbers, times and dates are written out ("1,204", "2 hours ago", "October 12") instead of abbreviated ("1.2k", "2h", "Oct"). Message times use a 24-hour clock.
- Follow, like and filter buttons now keep their visible text in their accessible name; the filter shows a tick when selected.
- Message drafts are kept per conversation instead of being shared between them.
- Avatars are darker so their initials stay readable, and the initials are generated content rather than text.
- The generated artwork has a text alternative on uploads and is hidden when decorative.

### Removed

- Notifications no longer mark themselves as read on a timer. Open one, or use "Mark all as read".
- Unused `--leaf` colour token and the `compact()` number formatter.

## [0.1.0] - 2026-10-30

### Added

- First UI implementation: Home, Explore, Messages, Notifications, Uploads and Profile pages.
- Hash-based router (`#/explore`, `#/messages/:id`, `#/uploads/:userId`, `#/u/:id`) that resets scroll on navigation.
- Header with primary navigation, unread badges, user menu and a light/dark theme toggle.
- Reusable components: upload cards, artwork, avatars, follow button and page headings.
- Sample data for users, uploads and messages.
- Express API with a `GET /api/health` endpoint reporting database status.
- MongoDB connection through Mongoose, configured with `MONGODB_URI` (see `.env.example`).
- Tailwind CSS 4, Heroicons, and the Figtree and Fraunces fonts.
- `npm run dev` to run the client and API together; Vite proxies `/api` to the server.

### Changed

- Replaced the Vite starter template UI and styles with the app's own design.
- Rewrote the README to describe the project, setup and scripts.

## [0.0.0] - 2026-10-30

### Added

- Initial project scaffold from the Vite React + TypeScript template.
