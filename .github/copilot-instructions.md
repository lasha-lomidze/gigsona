# Gigsona — Copilot Instructions

## Stack
- Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Tailwind CSS 4.
- Drizzle ORM + Neon serverless PostgreSQL.
- Better Auth handles **authentication only** — sessions, users, accounts.
- Recharts for charts (client-only via `next/dynamic` with `ssr: false`).
- This is NOT stock Next.js — check `node_modules/next/dist/docs/` before assuming API behavior.

## Auth vs. app profile
- Better Auth owns identity/sign-in. Never put app data on Better Auth tables.
- App profile fields live in the `profiles` table: `displayName`, `role`, `status`, `avatarId`, `bio`, `avatarUrl`.
- Roles: `anonymous | student | mentor | assistant`. Status: `active | inactive`.

## Avatars
- Curated static presets in `public/avatars/` (mixed `.svg`/`.png`/`.webp` OK).
- `lib/avatars.ts` is the manifest; `profiles.avatar_id` stores only the chosen ID.
- Initials are the fallback when no avatar is chosen. No object storage chosen yet — don't add R2/uploads without asking.

## Aura / scoring (Manage is the #1 priority)
- `daily_aura_changes` is append-only. `new_aura` is the cumulative per-(day, category) score; a change's delta = `new_aura - previous_aura`.
- Aura categories: `activity, classwork, camera, attendance, qa, workout`.
- **Any aura/scoring behavior change MUST update the Manage Rulebook in the same change.**
- Manage UX = smoothness, speed, clarity. Optimize for it above all else.

## Stats
- Role-scoped: students get received-aura stats (top category, attendance, camera, days active); mentors/assistants get group-oversight stats (groups, students, aura given 7d, total).
- Shared client-safe types/labels live in `lib/aura-stats-shared.ts` (NO db import). Server queries in `lib/aura-stats.ts`. Never import the server module from a client component — it pulls in `dotenv` and crashes the browser bundle.

## Conventions
- Validate on the server; keep client components free of DB/dotenv imports.
- Prefer minimal desktop scrolling on profile/admin pages.
- Don't drop DB columns or user data without asking.
