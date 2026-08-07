# agent.md — منصة الفردوس

## What this project is

A full-featured Arabic Quran school management platform (منصة الفردوس) built with Next.js App Router. It manages students, teachers, groups, attendance (manual / QR / barcode), memorization tracking, finance, notifications (including Web Push), messages, guardian portal, and admin settings. The UI is RTL Arabic, mobile-first.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, server components) |
| Language | TypeScript — strict, no `@ts-ignore` |
| Database | PostgreSQL via Drizzle ORM + `postgres` driver |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| PDF/Excel | jsPDF + ExcelJS |
| Push notifications | web-push (VAPID) |
| Package manager | pnpm |
| Port | 13000 (dev and start) |

---

## Architecture rules

### Auth
- Sessions are base64-encoded JSON cookies named `session`, set as `httpOnly` for 7 days.
- `lib/auth.ts` provides `getSession()`, `createSessionToken()`, `hashPassword()`, `verifyPassword()`.
- Passwords are SHA-256 hex strings (no salt). Default admin password after any restore: `admin123`.
- `SessionUser.role` is a plain `string` — never an enum. Built-in roles: `admin`, `teacher`, `guardian`. Custom roles behave identically to `teacher` in the UI.

### Database
- One `postgres` client per request via React `cache()` — never a global singleton.
- All DB access goes through `db/index.ts`; never import `postgres` directly in pages or API routes.
- `db/schemas/schema.ts` is the single source of truth for all table definitions.
- Drizzle migrations live in `drizzle/` — run with `pnpm db:migrate`.
- `users.role` is `varchar(50)` — the legacy `user_role` enum still exists in DB but the column no longer uses it.

### Student numbering invariant
- Every student's `id` must equal the numeric part of their `studentNumber`.
- `FD0001` → `id = 1`, `FD0109` → `id = 109`, `FD0374` → `id = 374`.
- This is enforced on creation (auto-generate `studentNumber` from `id`) and on restore (remap old ids to FD numbers).
- Never break this invariant. Any restore script must remap all FK references (group_students, attendances, memorization_sessions, homework, fee_payments).

### API routes
- Every route must return JSON — never raw HTML — on error.
- Auth check pattern: `const session = await getSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- Admin-only routes additionally check `session.role !== 'admin'`.
- Use `logActivity()` from `lib/activity.ts` after significant mutations (create / update / delete / login). Errors from `logActivity` are silently swallowed.
- Error handling: use `lib/errors.ts` classes (`AppError`, `ValidationError`, `UnauthorizedError`, `NotFoundError`) and `handleApiError()` for consistent error shapes.

### Layout / Role routing
- Every protected page has a `layout.tsx` that calls `getSession()` and redirects to `/login` if unauthenticated.
- Guardian sessions redirect to `/guardian-dashboard`.
- Custom roles get the teacher-style bottom nav and teacher-visible sidebar items.
- `MobileLayout` wraps all protected pages. The `role` prop accepts any string — custom roles use teacher-style nav (`role !== 'admin'`).

### Landing page
- Controlled by `settings.key = 'landing_enabled'` (value `'true'` / `'false'`).
- `app/page.tsx` reads this setting: if enabled renders `<LandingPage>`, otherwise redirects to `/login`.
- `/api/landing` is a public endpoint (no auth) that returns landing page settings.

### Backup / Restore
- Backup version: `3.0`. Exports 20 tables.
- Restore remaps student ids to FD numbers, fixes all FK references, resets admin passwords to `admin123`, and syncs all sequences.
- The backup API is at `GET /api/backup` (export) and `POST /api/backup` (restore).

### Push notifications
- VAPID keys must be set in env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`.
- `lib/vapid.ts` reads them at runtime (not build time) to avoid baking empty strings.
- `web-push` is in `serverExternalPackages` in `next.config.ts` — keep it there.
- Subscriptions stored in `push_subscriptions` table. Expired endpoints (410/404) are auto-cleaned on send.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `VAPID_PUBLIC_KEY` | For push | Server-side public key |
| `VAPID_PRIVATE_KEY` | For push | Server-side private key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push | Client-side public key (same value as `VAPID_PUBLIC_KEY`) |
| `VAPID_SUBJECT` | For push | `mailto:` or `https://` URI |

---

## Key conventions

- All DB column names are `snake_case`; TypeScript fields are `camelCase` (Drizzle maps automatically).
- Dates stored as `date` columns use ISO string `YYYY-MM-DD` in API responses.
- Timestamps use ISO 8601 with `Z` suffix.
- Arabic text direction: the root `<html>` has `dir="rtl" lang="ar"`.
- Font: Cairo (Google Fonts) loaded via `next/font`.
- Never add `notranslate` or disable browser translation globally.

---

## Adding a new feature — checklist

1. Add table to `db/schemas/schema.ts` → run `pnpm db:generate` then `pnpm db:migrate`.
2. Add API route under `app/api/<feature>/route.ts` — always return JSON, always check session.
3. Add page under `app/<feature>/page.tsx` with a `layout.tsx` that guards the session.
4. If the page needs sidebar access, add it to `Sidebar.tsx` under the appropriate role block.
5. If data must survive backup/restore, add the table to both export and restore blocks in `app/api/backup/route.ts` and in `scripts/restore-new-backup.mjs`.
6. Run `pnpm build` — fix all TypeScript errors before committing.