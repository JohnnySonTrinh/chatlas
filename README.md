# Chatlas

Chatlas is a spatial social sandbox built with Next.js and Supabase. People can pan and zoom across a large shared 2D world, discover conversation clusters, create public chat bubbles, and chat in realtime inside each bubble.

## Stack

- Next.js App Router
- TypeScript with strict mode
- Tailwind CSS
- Supabase Auth, Postgres, Realtime, and Storage-ready integration
- DOM-based world rendering with CSS transforms and viewport culling

## Features

- Name-first guest entry with Supabase anonymous auth
- Anonymous exploration of the shared world
- Optional Supabase Auth upgrades remain available if you want them later
- Bubble creation at camera center for anyone who joins with a name
- Drag, resize, rename, and delete for bubble owners only
- Public per-bubble chat threads with optimistic sends
- Realtime message updates and lightweight bubble presence
- Zoomed-out clustering so the map stays legible
- Floating world toolbar, loading states, empty states, and toasts
- Seeded demo bubbles and conversations

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env.local
```

3. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

4. Apply the database schema and seed data in Supabase:

```bash
npm run supabase:reset
```

This project includes:

- [`supabase/migrations/001_init.sql`](/c:/Users/Johnny/Documents/GitHub/Chatlas/supabase/migrations/001_init.sql)
- [`supabase/seed.sql`](/c:/Users/Johnny/Documents/GitHub/Chatlas/supabase/seed.sql)

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Project structure

```text
app/
  auth/callback/route.ts      Supabase OAuth and magic-link callback
  globals.css                 Global theme and world background styling
  layout.tsx                  Root layout and providers
  page.tsx                    Server-side bootstrap for bubbles and auth
components/
  chatlas-app.tsx             Main client app shell
  world/                      Spatial world UI, bubbles, toolbar, side panel
hooks/
  use-camera.ts               Persisted camera state
  use-bubble-messages.ts      Realtime bubble thread hook
  use-world-presence.ts       Realtime presence hook
lib/
  constants.ts                World, bubble, zoom, and clustering limits
  supabase/                   Browser/server/middleware Supabase clients
  types.ts                    App-level typed models
supabase/
  migrations/001_init.sql     Schema, RLS, views, triggers, realtime setup
  seed.sql                    Example users, bubbles, and messages
types/
  supabase.ts                 Supabase database type definitions
```

## Architecture notes

### Camera model

The camera is stored as `{ x, y, zoom }`, where `x` and `y` are world coordinates centered in the viewport and `zoom` is a scalar applied to the world layer. Bubble positions are always stored in world space, never screen space. Panning updates camera position, while zooming recalculates camera position so the world point under the cursor stays anchored.

### Viewport culling

The app computes a visible world rectangle from the camera and viewport size, then only renders bubbles that intersect that rectangle plus a buffer margin. This keeps drag and zoom smooth without needing canvas or WebGL. When zoom drops below the cluster threshold, visible bubbles are grouped into simple density clusters instead of rendering unreadable overlap piles.

### Realtime approach

Supabase Realtime is used in three ways:

- table change subscriptions for `bubbles`
- table change subscriptions for `messages`
- presence tracking over a dedicated world channel

Presence payloads are intentionally small and UI-focused: session identity, display name, avatar, active bubble, and camera. That keeps the integration easy to swap for Liveblocks later if richer collaborative presence becomes necessary.

### Why DOM-based world for v1

Chatlas is a social navigation product, not a whiteboard. A DOM-first world keeps the implementation accessible, easy to style, and fast enough for bubble cards, chat previews, and responsive hover or selection states. CSS transforms plus culling give us a strong MVP without the complexity of a canvas scene graph.

## Auth and security

- Visitors can browse without joining
- Guests join by entering a display name, which creates an anonymous Supabase auth session
- Guest and signed-in users can create bubbles and send messages
- Only bubble owners can move, resize, rename, or delete their bubbles
- Profiles are created automatically from `auth.users` via a trigger
- RLS policies enforce all write constraints at the database level

## Local Supabase

This repo now includes a Supabase CLI config at [supabase/config.toml](/c:/Users/Johnny/Documents/GitHub/Chatlas/supabase/config.toml) and convenience scripts:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:stop
```

Important: the local Supabase stack requires Docker Desktop. If you do not want to run Docker locally, you can instead create a hosted Supabase project and copy its URL and anon key into `.env.local`.

## Hosted Supabase

If you want to use a hosted Supabase project instead of Docker:

1. Create a project in the Supabase dashboard.
2. Open the project's Connect dialog or API settings and copy:
   - Project URL
   - Publishable key or legacy anon key
3. Put those into `.env.local`.
4. In Supabase Dashboard, go to SQL Editor and run [`supabase/migrations/001_init.sql`](/c:/Users/Johnny/Documents/GitHub/Chatlas/supabase/migrations/001_init.sql).
5. Optional: run [`supabase/seed.sql`](/c:/Users/Johnny/Documents/GitHub/Chatlas/supabase/seed.sql) if you want example bubbles and conversations.
6. In Authentication > Providers, enable Anonymous Sign-Ins.
7. In Authentication > URL Configuration, set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000`
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000`
     - `http://127.0.0.1:3000/auth/callback`
8. If you also want email magic links or Google later, enable those providers separately.

## Notes

- The world bounds are set to a large initial coordinate space and can be expanded later.
- Realtime summaries are refreshed from the `bubble_summaries` view after bubble and message changes so previews stay accurate.
- The app is desktop-first, with a reasonable mobile fallback via the bottom sheet chat panel and touch-friendly controls.
