# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-13

The first stable release. Everyone now has their own account, with a private inbox and real message delivery, and the whole interface is translated. This release also adds profile photos and background images. There are two breaking changes compared with 0.3.0; see "Upgrading from 0.3.0" below.

### Added

- Profile photo and background image. On your own profile, "Change profile photo" and "Change background image" open a dialog with a preview, and a remove button once you have one. Photos only (JPEG, PNG, WebP or GIF), up to 3 MB, which is less than the limit for a post's file. Errors are shown next to the field and announced to screen readers, as is the result. A replaced or removed image is also deleted from the server.
- `PUT /api/me/avatar` and `PUT /api/me/background` point your profile at a photo you have already sent to `/api/media` (`{ url }`; 400 if it is not a photo, is missing or is over 3 MB). `DELETE` on the same paths removes the image and answers 204. Users gain optional `avatarUrl` and `backgroundUrl` fields.
- Translations: the whole interface is now available in English, Swedish (Svenska), Japanese (日本語) and Traditional Chinese as written in Taiwan (繁體中文). The account menu, next to the link to your profile, has a Language button. The choice is remembered in the browser; until you make one, the browser's language is used. The page's `lang` attribute, the page title, dates, times, numbers and plurals follow the language, and changing it is announced to screen readers. Text that people wrote (posts, captions, messages, names) is not translated. The glossary words stay as written in posts, with their meanings translated. Texts live in `src/i18n/`; the build fails if a language is missing a message.
- Accounts. Every person now has their own account instead of everyone acting as the same demo user. A sign-in and a "Create your account" page (name, username, password) are shown while nobody is signed in, and the account menu has a "Sign out" button. Signing in or out moves focus to the new page's heading, errors are shown next to the field and announced to screen readers, and the page you were on is restored after signing in.
- `POST /api/auth/register`, `POST /api/auth/login` and `POST /api/auth/logout`. Sessions are a random token in an `httpOnly`, `SameSite=Lax` cookie (30 days); only its hash is stored. Passwords are stored as salted scrypt hashes. Sign-ins are limited to 20 per 10 minutes and new accounts to 10 per hour per visitor.
- The sample users can sign in as `firstname.lastname` (for example `ernesto.neyra`) with the password `password`.
- Start a conversation with anyone. Messages has a "New message" button that searches people by name or handle, and the "Message" button on a profile now works for people you have not written to yet. A new thread starts empty with the keyboard in the message box, and the conversation exists once the first message is sent.
- Messages are now delivered. Sending a message also puts it in the recipient's inbox (as unread) and gives them one "sent you a message" notification for a run of unread messages. Unsending removes it from their copy too, and clears the unread count and notification if nothing unread is left.

### Changed

- The validation rules in `src/data/accountRules.ts` and `src/data/postRules.ts` now return messages (`{ key, params }`) instead of English sentences, so the form can show them in the chosen language. The API still answers in English.
- `POST /api/conversations/:userId/messages` creates the conversation if it does not exist. It answers 400 for yourself and 404 for an unknown user, no longer 404 for a conversation you have not started.
- **Breaking:** every `/api` route except `/api/auth/*` and `/api/health` answers 401 without a session, and acts as the signed-in user. Posts, likes, follows, conversations and notifications are scoped to the account: `conversations` gain an `ownerId` and `notifications` a `recipientId`. A database from before this change is upgraded on the next start (the existing inbox goes to `ernesto`; the old unique index `conversations.userId_1` is replaced by one on `ownerId` + `userId`).
- The screenshots in `docs/screenshots/` are retaken for 1.0.0, signed in as a sample user.
- The type filter helper `filterByKinds` moved from `src/components/KindFilter.tsx` to `src/lib/kinds.ts`.
- `npm run seed` no longer resets the password of a sample user that already exists. The demo reset also deletes accounts people registered, and their sessions.
- Password hashing no longer blocks the server while it runs (`server/password.ts` is asynchronous).
- The screenshots script signs in as the sample user (set `SCREENSHOT_USER` and `SCREENSHOT_PASSWORD` to use another) before taking the pictures.

### Fixed

- `npm run lint` passes again: the profile image preview no longer sets state inside an effect, and an unused variable and a file that mixed components with other exports were cleaned up. Behaviour is unchanged.

### Upgrading from 0.3.0

- Back up your database first. On the first start of 1.0.0 the server upgrades it by itself: the existing inbox is assigned to the user `ernesto` and the unique index on `conversations` is replaced (see `server/migrate.ts`).
- Every `/api` route except `/api/auth/*` and `/api/health` now needs a session and answers 401 without one. Anything that called the API without signing in has to sign in first.
- The sample users sign in with the password `password`. Change it, or do not seed, before exposing a database you care about. `npm run seed` never resets a password that is already set.
- There are no new environment variables, and Node.js 24 or later is still required.

## [0.3.0] - 2026-11-06

### Added

- Explore now has a "Latest posts" section with the full post cards. The trending tags are buttons: pick one to show only the posts with that tag (selected with a tick, and announced to screen readers), pick it again to clear it.
- "Read more" on a post card opens the full title and description in a dialog (with the author, time and tags) when the card had to cut them short. It only appears when the text is actually cut off at that card width.
- A shrugging figure above "Nothing here yet." on empty Home and Uploads pages.

### Changed

- The type filter on Home and Uploads lets you pick several types at once (for example Photos and Audio). "All" clears the selection, and deselecting the last type goes back to "All".
- Home shows other people's work only; your own posts are on the Uploads page.
- The Uploads tab in the header now opens your own uploads and is only highlighted there. The "Show everyone's uploads" link on a user's uploads page is removed; other people's uploads are reached from their profiles.
- Post cards in a row are the same height: the title and description take a fixed amount of room (two lines each), so tags and the author line start in the same place on every card.
- The footer stays at the bottom of the window on short pages.
- Every button now shows the pointer (hand) cursor, except when disabled.

## [0.2.1] - 2026-11-03

### Added

- A "Try it" section in the README with a link to the live demo at <https://socia-med-2oti.onrender.com>. It explains that guests need no account and all act as the same demo user, that the sample data is restored every 24 hours, and that the free tier can take up to a minute to wake.
- Screenshots of the main pages (Home, Explore, Messages, Profile and Help in the dark theme) in `docs/screenshots/`, shown in a new "Screenshots" section of the README.
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
