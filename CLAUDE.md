# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GIIIN/ギイーン** — A civic engagement platform for Mihara City Council (広島県三原市議会), making council activities accessible to citizens via Q&A, council member profiles, news, and statistics.

## Commands

```bash
npm run dev:frontend     # Start Vite dev server (recommended for local dev)
npm run dev              # Start frontend + Convex backend in parallel (requires interactive terminal for Convex login)
npm run dev:backend      # Start Convex backend only
npm run build            # Production build
npm run build:prod       # Build targeting production Convex deployment
npm run build:dev        # Build targeting dev Convex deployment
npm run lint             # TypeScript type-check + build validation (no dedicated test runner)
```

There is no separate test command — `npm run lint` runs `tsc -p convex`, `tsc -p .`, `convex dev --once`, and `vite build` as validation.

## Local Development Setup

`.env.local` must point to the cloud Convex deployment (not local anonymous mode):

```
CONVEX_DEPLOYMENT=dev:outgoing-owl-339
VITE_CONVEX_URL=https://outgoing-owl-339.convex.cloud
```

If `.env.local` shows `127.0.0.1:3210` or `local:local-*`, the frontend will connect to an empty local database with no data. Run `npx convex login` in an interactive terminal from the project root to authenticate, then update `.env.local` to the values above.

`npm run dev` (parallel mode) fails in non-interactive terminals because the Convex CLI requires browser-based login. Use `npm run dev:frontend` instead and run `npx convex dev` separately in an interactive terminal if backend changes are needed.

## Architecture

### Stack
- **Frontend**: React 19 + Vite 6, TypeScript, Tailwind CSS, Sonner (toasts)
- **Backend**: Convex (serverless BaaS — real-time database, functions, file storage)
- **Auth**: `@convex-dev/auth` with email/password and anonymous providers
- **Email**: Resend via `convex/emailActions.ts`

### Convex vs. traditional backend
All backend logic lives in `convex/` as Convex functions (queries, mutations, actions). There is no Express/Fastify server. HTTP endpoints are defined in `convex/router.ts` and registered via `convex/http.ts`. The `convex/_generated/` directory is auto-generated — never edit it manually.

### Frontend navigation
Navigation is URL-hash-based, managed by `src/hooks/useUrlNavigation.ts`. The main `src/App.tsx` (700+ lines) controls which view is rendered based on URL state. There is no React Router.

### Performance tiers
`src/App.tsx` detects device hardware (CPU cores, memory) at startup and sets a performance tier (high/medium/low) that controls animation, blur effects, and rendering complexity.

### Key data domains (Convex tables in `convex/schema.ts`)
- `questions` / `responses` — council Q&A, indexed by member, session date, category
- `councilMembers` — member profiles with contact, party, committee info
- `news` — news articles with thumbnails
- `faqItems`, `contactMessages`, `userDemographics`, `slideshowSlides`, `menuSettings`
- `externalArticles` / `externalSources` — scraped blog/social content (blog, facebook, twitter, instagram, rss)
- `adminUsers` — role-based access (admin / superAdmin)
- `emailVerificationTokens` / `userEmailStatus` — token-based email verification and password reset flow

### External content aggregation
`convex/externalArticles.ts` and `convex/dataSync*.ts` scrape and sync content from external blogs/social sources using `cheerio` for HTML parsing.

### Import aliases
`@/*` maps to `./src/*` (configured in `tsconfig.json` and `vite.config.ts`). Use `@/components/...`, `@/hooks/...`, `@/lib/...` for internal imports.

### File storage
Images are stored via Convex Storage. The HTTP endpoint `/api/storage/{storageId}` (defined in `convex/router.ts`) returns a 302 redirect to a signed URL.

### LINE browser compatibility
`src/lib/utils.ts` contains LINE in-app browser detection and polyfills. Several UI behaviors differ in the LINE browser.

## Environments
- Dev Convex deployment: `outgoing-owl-339.convex.cloud`
- Prod Convex deployment: `shiny-pony-367.convex.cloud`
