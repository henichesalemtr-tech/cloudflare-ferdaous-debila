# scaffold.md — منصة الفردوس

## Directory structure

```
project/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — Cairo font, RTL, Toaster, PWA meta
│   ├── page.tsx                  # Root route — shows LandingPage or redirects to /login
│   ├── globals.css               # Tailwind base + custom CSS variables
│   │
│   ├── login/page.tsx            # Login form (no layout guard)
│   ├── register/page.tsx         # Public student registration request form
│   │
│   ├── dashboard/
│   │   ├── layout.tsx            # Guards session → redirects guardian to /guardian-dashboard
│   │   ├── page.tsx              # Stats cards, recent activity, top students
│   │   └── registration-requests/page.tsx
│   │
│   ├── students/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Student list, add/edit/delete, Excel import/export
│   │
│   ├── teachers/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── groups/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Groups + assign students + assign teachers
│   │
│   ├── attendance/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Manual attendance entry
│   │   ├── contact/page.tsx      # Contact guardian for absent student
│   │   └── scan-monitor/page.tsx # Live scan feed
│   │
│   ├── auto-attendance/
│   │   ├── layout.tsx
│   │   └── page.tsx              # QR code attendance scanner
│   │
│   ├── barcode-attendance/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Barcode attendance scanner
│   │
│   ├── teacher-attendance/
│   │   ├── layout.tsx            # (implicit from parent)
│   │   └── page.tsx              # Teacher attendance log
│   │ (no explicit layout — uses dashboard layout via parent)
│   │
│   ├── memorization/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Quran memorization sessions + homework
│   │
│   ├── schedules/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Weekly schedule builder
│   │
│   ├── rooms/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── finance/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Fees, expenses, salaries, donations
│   │
│   ├── notifications/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Send + list notifications; admin can push to all
│   │
│   ├── messages/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Internal messaging between users
│   │
│   ├── reports/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Attendance and student reports
│   │   └── cards/page.tsx        # Printable student report cards
│   │
│   ├── guardians/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── guardian-dashboard/
│   │   ├── layout.tsx            # Guards guardian role only
│   │   ├── page.tsx              # Guardian's child attendance/memorization view
│   │   └── GuardianLogout.tsx
│   │
│   ├── users/
│   │   ├── layout.tsx
│   │   └── page.tsx              # User management (admin only)
│   │
│   ├── roles/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Custom role management (admin only)
│   │
│   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx              # System settings + landing page config
│   │
│   ├── profile/
│   │   ├── layout.tsx
│   │   └── page.tsx              # User profile edit
│   │
│   └── backup/
│       ├── layout.tsx
│       └── page.tsx              # Export / import JSON backup
│
├── app/api/                      # API Routes (all return JSON)
│   ├── auth/
│   │   ├── login/route.ts        # POST — sets session cookie
│   │   ├── logout/route.ts       # POST — clears session cookie
│   │   └── me/route.ts           # GET — returns current session user
│   │
│   ├── students/
│   │   ├── route.ts              # GET (list+search) | POST (create)
│   │   ├── [id]/route.ts         # GET | PUT | DELETE
│   │   ├── [id]/absences/route.ts
│   │   ├── [id]/groups/route.ts
│   │   ├── import/route.ts       # POST — Excel import
│   │   └── export/route.ts       # GET — Excel export
│   │
│   ├── teachers/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   ├── [id]/groups/route.ts
│   │   └── detail/route.ts
│   │
│   ├── groups/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   ├── [id]/students/route.ts
│   │   └── [id]/teacher/route.ts
│   │
│   ├── attendance/
│   │   ├── route.ts              # GET | POST
│   │   ├── contact/route.ts      # POST — notify guardian
│   │   └── sync-status/route.ts
│   │
│   ├── teacher-attendance/route.ts
│   │
│   ├── memorization/
│   │   └── sessions/route.ts     # GET | POST
│   │
│   ├── schedules/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── generate/route.ts
│   │
│   ├── rooms/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   │
│   ├── subjects/route.ts
│   ├── surahs/route.ts           # GET — 114 Quran surahs
│   │
│   ├── notifications/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   ├── [id]/read/route.ts
│   │   ├── absence-alert/route.ts
│   │   └── my-guardians/route.ts
│   │
│   ├── push/
│   │   ├── subscribe/route.ts    # GET (vapid key) | POST (save sub) | DELETE (remove)
│   │   └── send/route.ts         # POST — send web push to target users
│   │
│   ├── messages/route.ts
│   │
│   ├── finance/
│   │   ├── fees/route.ts
│   │   ├── expenses/route.ts
│   │   ├── salaries/route.ts
│   │   └── donations/route.ts
│   │
│   ├── users/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   │
│   ├── roles/route.ts
│   ├── guardians/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   │
│   ├── guardian/dashboard/route.ts
│   │
│   ├── registration-requests/
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── [id]/accept/route.ts
│   │
│   ├── settings/route.ts         # GET | POST (upsert key-value pairs)
│   ├── landing/route.ts          # GET — public, no auth
│   ├── backup/
│   │   ├── route.ts              # GET (export v3.0) | POST (restore)
│   │   └── seed/route.ts
│   │
│   ├── dashboard/
│   │   ├── stats/route.ts
│   │   └── top-students/route.ts
│   │
│   ├── scan-logs/
│   │   ├── route.ts
│   │   └── export/route.ts
│   │
│   ├── activity-logs/route.ts
│   ├── profile/route.ts
│   ├── health/route.ts           # GET — simple liveness check
│   └── admin/cleanup-temp/route.ts
│
├── components/
│   ├── MobileLayout.tsx          # Main shell — sidebar + header + bottom nav
│   ├── Sidebar.tsx               # Desktop sidebar, role-aware nav items
│   ├── Header.tsx                # Top bar with menu button and user info
│   ├── LandingPage.tsx           # Public marketing landing page
│   ├── PushNotificationManager.tsx  # Handles browser push subscription lifecycle
│   ├── PushEnableButton.tsx      # One-click push enable button for users
│   ├── PushManagerClient.tsx     # Client component for push state management
│   ├── SplashScreen.tsx          # App loading splash
│   ├── SplashWrapper.tsx         # Wraps root layout with splash logic
│   ├── HappySeedsWatermark.tsx   # Attribution watermark (do not remove)
│   ├── AgentationGuard.tsx       # Dev-mode guard
│   ├── barcode-display/          # Barcode rendering components
│   └── ui/                       # shadcn/ui components (do not edit manually)
│
├── db/
│   ├── index.ts                  # Drizzle client — one per request via React cache()
│   └── schemas/
│       └── schema.ts             # All table definitions + relations + enums
│
├── lib/
│   ├── auth.ts                   # getSession, createSessionToken, hashPassword
│   ├── activity.ts               # logActivity() — silent activity log writer
│   ├── errors.ts                 # AppError, ValidationError, UnauthorizedError, NotFoundError
│   ├── vapid.ts                  # getVapidConfig(), getVapidPublicKey() — runtime env reads
│   ├── utils.ts                  # Client-side utilities
│   ├── utils-server.ts           # Server-only utilities
│   ├── env.ts                    # Typed env variable accessors
│   ├── logger.ts                 # Server-side logger
│   └── request.ts                # HTTP request helpers
│
├── hooks/
│   ├── use-mobile.ts             # useIsMobile() hook
│   └── use-toast.ts              # Toast helper
│
├── utils/
│   └── cn.ts                     # Tailwind className merger
│
├── drizzle/                      # SQL migration files
│   ├── 0000_damp_miracleman.sql  # Initial schema — all base tables + enums
│   ├── 0001_broken_grim_reaper.sql  # notification_type enum, registration_requests, scan_logs
│   └── meta/                     # Drizzle migration metadata
│
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── ferdous-platform.zip      # Downloadable project archive
│
├── scripts/
│   ├── restore-new-backup.mjs    # Node script — restores backup with FD id remapping
│   └── copy-db-to-neon.mjs       # Node script — copies full DB to a Neon target
│
├── .env                          # Local secrets (not committed)
├── .env.example                  # Original env template
├── .env.local.example            # Localhost deployment template
├── next.config.ts                # Next.js config — web-push in serverExternalPackages
├── drizzle.config.ts             # Drizzle Kit config
├── tsconfig.json                 # TypeScript config — path alias @/ → ./
├── tailwind.config.ts            # Tailwind config
├── components.json               # shadcn/ui config
├── package.json                  # pnpm, scripts: dev|build|start|db:migrate|db:generate
├── pnpm-lock.yaml
├── DEPLOY_LOCAL.md               # Full deployment guide (localhost + Vercel)
├── agent.md                      # This project's AI agent instructions
└── scaffold.md                   # This file — project structure reference
```

---

## Database tables

| Table | Description |
|---|---|
| `settings` | Key-value app configuration |
| `users` | All login accounts (admin / teacher / guardian / custom) |
| `roles` | Custom role definitions with permission arrays |
| `students` | Student records — `id` always equals FD number |
| `teachers` | Teacher profiles linked to a `users` account |
| `groups` | Class groups (أفواج) |
| `guardians` | Guardian contact records (separate from users) |
| `rooms` | Physical classrooms |
| `subjects` | Academic subjects |
| `schedules` | Weekly class schedule slots |
| `group_students` | Many-to-many: students ↔ groups |
| `teacher_groups` | Many-to-many: teachers ↔ groups |
| `attendances` | Per-student daily attendance records |
| `teacher_attendances` | Per-teacher daily attendance |
| `memorization_sessions` | Quran memorization progress per student |
| `homework` | Assigned homework (per student or per group) |
| `surahs` | 114 Quran surah names and metadata |
| `fee_payments` | Student fee payment records |
| `expenses` | School expense records |
| `salary_payments` | Teacher salary payment records |
| `donations` | Donation records |
| `notifications` | In-app notifications (manual + auto absence alerts) |
| `notification_reads` | Tracks which users read which notifications |
| `messages` | Internal messages between users |
| `push_subscriptions` | Web Push subscription objects per user |
| `registration_requests` | Public student registration form submissions |
| `scan_logs` | QR / barcode scan event log |
| `activity_logs` | Admin audit log of all significant actions |
| `session_fee_settings` | Per-group fee configuration |
| `teacher_salary_settings` | Per-teacher salary configuration |

---

## npm scripts

```bash
pnpm dev          # Start dev server on port 13000
pnpm build        # Production build
pnpm start        # Start production server on port 13000
pnpm db:generate  # Generate Drizzle migration files from schema changes
pnpm db:migrate   # Apply pending migrations to the database
pnpm db:studio    # Open Drizzle Studio (DB GUI)
pnpm lint         # ESLint with auto-fix
```

---

## Role access matrix

| Feature | admin | teacher | guardian | custom |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ❌ | ✅ |
| Students (full CRUD) | ✅ | view only | ❌ | like teacher |
| Teachers | ✅ | ❌ | ❌ | like teacher |
| Groups | ✅ | ✅ | ❌ | ✅ |
| Attendance | ✅ | ✅ | ❌ | ✅ |
| Memorization | ✅ | ✅ | ❌ | ✅ |
| Finance | ✅ | ❌ | ❌ | like teacher |
| Notifications (send) | ✅ | ✅ | ❌ | ✅ |
| Users & Roles | ✅ | ❌ | ❌ | ❌ |
| Settings & Backup | ✅ | ❌ | ❌ | ❌ |
| Guardian dashboard | ❌ | ❌ | ✅ | ❌ |

---

## Deployment targets

| Target | Notes |
|---|---|
| **Localhost** | `pnpm dev` on port 13000; PostgreSQL local or hosted |
| **Vercel** | Connect GitHub repo; set env vars; use Neon/Supabase for DB |
| **Cloudflare Workers** | `pnpm build:worker` via opennextjs-cloudflare; requires edge-compatible DB proxy |

See `DEPLOY_LOCAL.md` for step-by-step instructions.