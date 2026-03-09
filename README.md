# Team Tools

Real-time collaborative tools for agile teams — Sprint Retrospective and Planning Poker, running in the browser with no accounts required.

## Table of Contents

- [What is it](#what-is-it)
- [Why use it](#why-use-it)
- [Apps](#apps)
  - [Retro](#retro)
  - [Poker](#poker)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Running locally](#running-locally)
- [Deployment](#deployment)

---

## What is it

A single-page React application that hosts two tools:

- **Retro** — facilitates sprint retrospectives with structured phases (Write → Vote → Discuss → Export). Team members add cards to configurable categories, dot-vote anonymously, then discuss top items and export the results.
- **Poker** — facilitates agile story-point estimation via Planning Poker. The host imports a backlog (or adds stories manually), the team votes with playing cards, and the host confirms final estimates that can be exported back to a Rally-compatible CSV.

All collaboration is real-time via Firebase Realtime Database. No sign-up, no accounts — just share a session link or code.

## Why use it

- **Zero friction** — join a session with a name and a code, nothing else.
- **Real-time sync** — all participants see updates instantly; presence tracking shows who is online.
- **Host-resilient** — if the host disconnects, the longest-tenured online member is automatically promoted.
- **Rally-compatible export** — import stories from a Rally CSV export and export estimates back in the same format.
- **Self-hostable** — bring your own Firebase project; the app is a static build deployable anywhere.

## Apps

### Retro

1. **Create a session** — choose your name, pick a retrospective format (Start/Stop/Continue, 4Ls, etc.) or define custom categories, click *Create Session*.
2. **Share the code** — copy the 6-character short code or the full session ID from the top bar and send it to your team.
3. **Write phase** — everyone adds cards to each category anonymously.
4. **Vote phase** — each member gets as many votes as there are categories; dot-vote on the cards that matter most.
5. **Discuss phase** — cards are sorted by votes; the team discusses top items.
6. **Export phase** — download results as JSON, Markdown, or Confluence wiki markup.

> The host controls phase transitions. If the host leaves and other members are online, host role transfers automatically.

### Poker

1. **Create a session** — choose your name, select a card set (Modified Fibonacci · Fibonacci · T-Shirt), optionally import a Rally CSV, click *Create Session*.
2. **Share the code** — same as Retro.
3. **Select a story** — the host clicks a story in the left sidebar to make it the active story.
4. **Vote** — all members pick a card; a check mark appears next to each member's avatar as they vote.
5. **Reveal** — the host clicks *Reveal Votes*; all cards flip simultaneously.
6. **Confirm estimate** — the Result Panel shows individual votes, average, most common value, and a consensus indicator. The host sets the final estimate and clicks *Confirm Estimate* to save it and move on.
7. **Export** — click the download icon in the top bar at any time to export all stories with their estimates as CSV, Markdown, or JSON.

#### Importing stories from Rally

Export your user stories from Rally as CSV (include columns: `FormattedID`, `Name`, `Description`, `PlanEstimate`). In the Poker landing page, click *Import from CSV* before creating the session, or use the *Import CSV* button in the story sidebar during a session.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com/) project with **Realtime Database** enabled

### Installation

```bash
git clone <repo-url>
cd retro-app
npm install
```

### Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Firebase project values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Running locally

```bash
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
npm run lint     # ESLint
```

## Deployment

The app is a static build. Any static host works. For Netlify, `netlify.toml` already includes the catch-all redirect required for client-side routing:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Set the `VITE_FIREBASE_*` environment variables in your hosting provider's dashboard — do **not** commit `.env`.
