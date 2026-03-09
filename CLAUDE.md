# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build → dist/
npm run lint       # ESLint
npm run preview    # serve the dist/ build locally
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env` and fill in real Firebase values. All variables are prefixed `VITE_FIREBASE_*` and consumed via `import.meta.env` in `src/firebase.js`. Deployed to Netlify; `netlify.toml` has a catch-all redirect for SPA routing.

## Architecture

Two collaborative real-time apps share a single React SPA, routed under `/retro` and `/poker`.

### Routing (`src/App.jsx`)
```
/                          → HomePage (app launcher)
/retro                     → pages/LandingPage.jsx
/retro/session/:sessionId  → pages/SessionPage.jsx
/poker                     → pages/poker/LandingPage.jsx
/poker/session/:sessionId  → pages/poker/SessionPage.jsx
```

### Firebase Realtime Database shape

**Retro** (`/sessions/{sessionId}/`):
- `meta/` — `{ phase, categories[], hostId, createdAt }`
- `members/{userId}/` — `{ name, joinedAt, online }`
- `cards/{cardId}/` — `{ content, category, authorId, authorName, votes }`

**Poker** (`/poker/{sessionId}/`):
- `meta/` — `{ createdAt, hostId, currentStoryId, revealed, cardSet }`
- `members/{userId}/` — `{ name, joinedAt, online }`
- `stories/{storyId}/` — `{ formattedId, name, description, finalEstimate, order }`
- `votes/{storyId}/{userId}` — string card value

### Shared patterns

**User identity** — stored in `localStorage` as `retro_user_{sessionId}` or `poker_user_{sessionId}` (`{ userId, name }`). If missing on direct URL entry, a `prompt()` collects the name.

**Presence** — `src/hooks/usePresence.js` writes `online: true` on mount and `online: false` on unmount/disconnect. Accepts an optional 4th param `collection` (default `'sessions'`); poker passes `'poker'`.

**Auto host election** — both `useSession` and `usePokerSession` watch `members`; when the host goes offline, the online member with the earliest `joinedAt` writes the new `hostId` to prevent race conditions.

### Retro-specific

Four phases driven by `meta.phase`: `write → vote → discuss → export`. Phase transitions are host-only. `useCards` manages card CRUD and per-user vote tracking.

### Poker-specific

`usePokerSession` manages session meta + members. `usePokerVoting` subscribes to `stories` and `votes` for the current story. Card sets (`modified_fibonacci`, `fibonacci`, `tshirt`) are defined in `src/components/poker/VotingCards.jsx`.

CSV import (`src/utils/csvParser.js`) normalises Rally headers (`formattedid`, `name`, `description`, `planestimate`) and handles quoted fields. Export (`src/utils/pokerExport.js`) produces Rally-compatible CSV, Markdown, and JSON — all including `finalEstimate`.
