# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
