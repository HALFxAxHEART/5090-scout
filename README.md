# 5090 Scout

Match scouting for FRC Team 5090 — manual entry (with an optional synced video panel so
scouts can tap along while watching instead of relying on memory), offline-first with
QR-code sync for events with no signal, TBA/Statbotics-backed team and event data, and a
drag-and-drop pick list for alliance selection.

## Status

Foundational build: auth, TBA/Statbotics ingestion, configurable per-season scoring
schema, the scouting form (direct submit + offline queue + QR export/scan sync), and the
pick list are all wired up end to end. Point values in the bundled 2025 example schema
are approximate — check them against the official manual before scoring a real event
with it, or just add next year's schema once Kickoff happens (see "Seasons" below).

## Stack

Bun · TypeScript · React + Vite + TanStack Router (PWA) · tRPC · Postgres + Drizzle ORM.
Single Docker container, deployed via Coolify — same shape as the FRC Fantasy project.

## Project layout

```
apps/web       React frontend (PWA — installable, offline app shell)
apps/server    Bun + tRPC backend (also serves web's built assets)
packages/db    Drizzle schema + client — the source of truth for data shape
packages/shared  zod schemas, shared types, and the per-season game-scoring schemas
```

## Getting started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `TBA_API_KEY` (free key
   at https://www.thebluealliance.com/account). `TEAM_NUMBER` defaults to 5090.
2. `bun install`
3. `bun run db:migrate`
4. `bun run db:seed` — creates the 2025 example season as active so the scouting form has
   something to render immediately.
5. `bun run dev` — starts the backend (port 3000) and the Vite dev server, which proxies
   `/api` to it.
6. Sign up in the app — the first account created becomes admin. Use the Admin page to
   ingest your team's events from TBA.

## Seasons

Each year's scoring is data, not code: `packages/shared/src/games/<year>.ts`. At Kickoff,
add a new file with that year's scoring elements, then use the Admin page (or
`season.create`) to add it as a season and activate it — the scouting form updates
immediately, no redeploy needed. The live copy lives in the `seasons.game_schema` DB
column, so it can also be tweaked directly from the Admin page without touching code.

## Offline / QR sync

Every scouted match is written to the browser's local IndexedDB first and only pushed to
the server if there's a connection. If a scout's device has no signal, their pending
records show up on the **Sync** page as QR codes — hold one up to a second device (any
phone/laptop with a camera) running the same app in **Scan** mode, and it uploads
immediately. Records are keyed by a client-generated id, so re-scanning or re-submitting
the same record can never create a duplicate.
