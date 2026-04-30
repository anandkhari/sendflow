# SendFlow — Project Documentation

> Cold email outreach SaaS. First product. Target: 10,000 users.
> Last updated: 2026-04-24

---

## What This App Does

SendFlow lets users create multi-step cold email campaigns. They add prospects (manually or via CSV), write email sequences with follow-ups, and the app automatically sends them on a schedule. Opens and clicks are tracked.

**Core user flow:**
1. Sign up → Confirm email
2. Create a campaign
3. Write email steps (Initial Email + Follow-ups with delays)
4. Import prospects (CSV or manual)
5. Configure settings (timezone, send window, daily limit)
6. Start campaign → jobs are created and queued
7. Worker sends emails on schedule
8. Track opens + clicks in analytics (not built yet)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Email sending | Nodemailer + Gmail SMTP |
| Rich text editor | TipTap |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Deployment target | Vercel |

---

## Environment Variables

File: `.env.local`

| Variable | Purpose | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (browser-safe) | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-only, bypasses RLS) | ✅ Set |
| `EMAIL_HOST` | SMTP host (`smtp.gmail.com`) | ✅ Set |
| `EMAIL_PORT` | SMTP port (`587`) | ✅ Set |
| `EMAIL_USER` | Gmail address | ✅ Set |
| `EMAIL_PASS` | Gmail App Password | ✅ Set |
| `SEND_ENABLED` | Safety switch — set to `true` to actually send emails | ⚠️ `false` (intentional) |
| `TRACKING_BASE_URL` | Base URL for open/click tracking pixels | ✅ Set (localhost) |
| `NEXT_PUBLIC_APP_URL` | App base URL | ✅ Set |

> **Before going live:** Change `TRACKING_BASE_URL` and `NEXT_PUBLIC_APP_URL` to your production domain. Set `SEND_ENABLED=true` only when ready.

---

## Database Schema (Supabase / PostgreSQL)

All tables have Row Level Security (RLS) enabled. Users can only see their own data.

### `campaigns`
Main campaign record.
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | References `auth.users` — RLS key |
| `name` | text | Campaign name |
| `status` | text | `draft` / `active` / `paused` / `completed` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto-updated by trigger |

### `campaign_settings`
One row per campaign (1:1 relationship).
| Column | Type | Notes |
|---|---|---|
| `campaign_id` | uuid | FK → campaigns |
| `timezone` | text | e.g. `Asia/Kolkata` |
| `send_start` | time | e.g. `09:00` |
| `send_end` | time | e.g. `17:00` |
| `daily_limit` | integer | Max emails per day |
| `sending_days` | text[] | `["Mon","Tue","Wed"]` |
| `delay_seconds` | integer | Gap between individual sends |
| `track_opens` | boolean | |
| `track_clicks` | boolean | |
| `stop_on_reply` | boolean | |

> **Required SQL** (run once in Supabase SQL Editor if not done):
> ```sql
> alter table campaign_settings
>   add column if not exists sending_days text[] default '{}',
>   add column if not exists delay_seconds integer default 60,
>   add column if not exists track_opens boolean default true,
>   add column if not exists track_clicks boolean default true,
>   add column if not exists stop_on_reply boolean default true;
> ```

### `steps`
Email sequence steps. Each campaign has 1+ steps.
| Column | Type | Notes |
|---|---|---|
| `campaign_id` | uuid | FK → campaigns |
| `step_order` | integer | 1 = initial email, 2+ = follow-ups |
| `delay_days` | integer | Days after previous step |
| `subject` | text | Email subject line |
| `body` | text | HTML email body |
| `content_json` | jsonb | TipTap editor JSON (used to reload editor) |

### `prospects`
Email recipients per campaign.
| Column | Type | Notes |
|---|---|---|
| `campaign_id` | uuid | FK → campaigns |
| `email` | text | Unique per campaign |
| `first_name` | text | |
| `last_name` | text | |
| `company` | text | |

### `jobs`
Email send queue. One job = one email to one prospect for one step.
| Column | Type | Notes |
|---|---|---|
| `campaign_id` | uuid | |
| `prospect_id` | uuid | FK → prospects |
| `step_id` | uuid | FK → steps |
| `email` | text | Denormalized for fast worker queries |
| `scheduled_at` | timestamptz | When to send |
| `status` | text | `pending` / `sent` / `failed` / `skipped` |
| `attempt` | integer | Retry count |
| `sent_at` | timestamptz | When it was sent |
| `error` | text | Error message if failed |

### `tracking_events`
Opens and clicks recorded here.
| Column | Type | Notes |
|---|---|---|
| `job_id` | uuid | FK → jobs |
| `campaign_id` | uuid | For fast analytics queries |
| `event_type` | text | `open` or `click` |
| `url` | text | For clicks only |
| `ip` | text | |
| `user_agent` | text | |
| `created_at` | timestamptz | |

> RLS: Anyone can INSERT (tracking pixels have no auth). Only campaign owners can SELECT.

---

## Key File Map

```
src/
├── lib/
│   ├── supabase.js              Browser client (client components)
│   ├── supabase-server.js       Server client (API routes, server components)
│   └── supabase-admin.js        Admin client — bypasses RLS (worker, tracking, repository)
│
├── app/
│   ├── page.jsx                 Landing page
│   ├── login/page.jsx           Login form
│   ├── signup/page.jsx          Signup form
│   ├── auth/callback/route.js   Email confirmation handler
│   │
│   ├── dashboard/
│   │   ├── layout.jsx           Sidebar + logout
│   │   ├── page.jsx             Dashboard home (placeholder)
│   │   ├── settings/page.jsx    Account settings (placeholder)
│   │   └── campaigns/
│   │       ├── page.jsx         Campaign list
│   │       ├── new/page.jsx     Create campaign
│   │       └── [campaignId]/
│   │           ├── layout.jsx   Campaign header + Start/Pause buttons + tabs
│   │           ├── page.jsx     Email editor + step sidebar
│   │           ├── prospects/   Prospect management (CSV + manual)
│   │           └── settings/    Campaign send settings
│   │
│   └── api/
│       ├── send-email/route.js       Direct single email send (test utility)
│       ├── campaign/start/route.js   Activate campaign → create jobs
│       ├── campaign/reschedule/      ❌ Empty, not implemented
│       ├── track/open/route.js       Open pixel (1x1 GIF + saves to DB)
│       ├── track/click/route.js      Click redirect + saves to DB
│       └── worker/run/route.js       Trigger the send worker (needs cron)
│
├── components/
│   └── email-editor/
│       ├── EmailEditor.jsx      TipTap WYSIWYG editor (saves to steps table)
│       └── EditorToolbar.jsx    Bold, italic, links, {{FIRST_NAME}} variable
│
├── modules/
│   ├── campaigns/campaign.service.js   sendEmail() with tracking injection
│   └── emails/templates.js             HTML email template helpers
│
└── server/
    ├── db/campaign.repository.js        getCampaignById, updateCampaignStatus
    ├── queue/email.queue.js             createEmailJobs() — builds the jobs table
    └── worker/send.worker.js            runSendWorker() — processes pending jobs

middleware.js    Auth guard — blocks /dashboard for logged-out users
```

---

## How Email Sending Works (End to End)

```
User clicks "Start Campaign"
        ↓
POST /api/campaign/start
        ↓
campaign.repository → validate campaign exists, has steps + prospects
        ↓
email.queue.js → createEmailJobs()
  • Loads all steps (ordered)
  • Loads all prospects
  • For each prospect × step → creates a job with scheduledAt = now + cumulative delay
  • Inserts jobs in batches of 500
        ↓
campaign.status → "active"
        ↓
[later] GET /api/worker/run  ← needs to be triggered by cron
        ↓
send.worker.js → runSendWorker()
  • Queries jobs WHERE status='pending' AND scheduled_at <= now LIMIT 5
  • Loads step subject + body
  • Sends via Nodemailer (Gmail SMTP)
  • Injects open pixel + wraps links for click tracking
  • Updates job status → 'sent' or 'failed'
```

**Safety switch:** `SEND_ENABLED=false` in `.env.local` stops the worker before it sends anything. Always keep this `false` during development.

---

## Auth Flow

```
/signup → Supabase sends confirmation email
        ↓
User clicks link → /auth/callback?code=...
        ↓
Code exchanged for session → redirect to /dashboard
        ↓
middleware.js runs on every request
  • No session → redirect to /login
  • Has session → allow through
  • On /login or /signup with session → redirect to /dashboard
```

---

## Supabase Client Usage Rules

| Where | Which client | Why |
|---|---|---|
| React client components (`"use client"`) | `createClient()` from `supabase.js` | Browser, has user session via cookies |
| Next.js Server Components / API routes with user session | `createClient()` from `supabase-server.js` | Server, reads cookies |
| Worker, tracking routes, repository (no user session) | `createAdminClient()` from `supabase-admin.js` | Bypasses RLS — server only, never expose |

---

## What's Working ✅

- User signup, email confirmation, login, logout
- Dashboard protected — redirects to login if not authenticated
- Create campaigns
- Multi-step email sequences with configurable delays
- Prospect import (CSV) and manual entry with deduplication
- Rich text email editor (TipTap) — saves subject + HTML + JSON
- Campaign settings (timezone, send window, daily limit, tracking flags)
- Campaign activation → creates email jobs in DB
- Email sending via Gmail SMTP (with SEND_ENABLED=true)
- Open pixel tracking → saved to `tracking_events`
- Click tracking with redirect → saved to `tracking_events`

---

## What's NOT Built Yet ❌

| Feature | Priority | Notes |
|---|---|---|
| **Analytics dashboard** | 🔴 High | Data is being collected in `tracking_events`, just no UI to show it |
| **Worker cron automation** | 🔴 High | `/api/worker/run` must be called manually — no scheduled trigger |
| **Email preview before send** | 🟡 Medium | User can't see how email looks before activating |
| **Error toasts in UI** | 🟡 Medium | Failures are silent — no feedback to user |
| **Dashboard home page** | 🟡 Medium | Just says "Dashboard" — no stats, no overview |
| **Mailbox management** | 🟡 Medium | Hardcoded `"default-mailbox"` — no UI to configure sender |
| **Campaign rescheduling** | 🟠 Low | Route + module exist but are empty |
| **SendGrid provider** | 🟠 Low | Only Gmail SMTP works — file exists but is empty |
| **Stop on reply** | 🟠 Low | Setting saved but never checked during sending |
| **Account settings page** | 🟠 Low | Placeholder only |

---

## Next Steps (Recommended Order)

### Step 1 — Run the missing SQL (5 minutes)
If not done yet, run this in Supabase SQL Editor:
```sql
alter table campaign_settings
  add column if not exists sending_days text[] default '{}',
  add column if not exists delay_seconds integer default 60,
  add column if not exists track_opens boolean default true,
  add column if not exists track_clicks boolean default true,
  add column if not exists stop_on_reply boolean default true;
```

### Step 2 — Set up worker cron (1–2 hours)
The worker exists and works. It just needs something to call it on a schedule.
Options:
- **Vercel Cron** (easiest if deploying to Vercel) — add to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/worker/run", "schedule": "* * * * *" }] }
  ```
  Note: Requires Vercel Pro plan for sub-minute intervals.
- **GitHub Actions** — free, runs every 5 minutes minimum
- **Supabase Edge Functions** — can be scheduled

### Step 3 — Analytics dashboard (4–8 hours)
Data is already being recorded in `tracking_events`. Need to:
1. Build a stats API route that queries open/click counts per campaign
2. Build a UI that shows: total sent, open rate %, click rate % per campaign
3. Add per-prospect stats to the prospects table view

### Step 4 — Error toasts in UI (1–2 hours)
Every form action currently fails silently. Need toast notifications for:
- Campaign creation failure
- Prospect import errors
- Campaign start errors
- Email save confirmation (already done with "Saved ✓" state)

### Step 5 — Email preview (2–3 hours)
Let users see a rendered preview of the email with a sample prospect's data before sending.

### Step 6 — Dashboard home page (2–3 hours)
Replace the placeholder with real stats:
- Number of active campaigns
- Emails sent this week
- Overall open rate
- Recent activity feed

---

## Known Gotchas

1. **`SEND_ENABLED=false`** — emails will NOT send until you explicitly change this. This is intentional to prevent accidents during development.

2. **Tracking URLs are localhost** — `TRACKING_BASE_URL=http://localhost:3000` means tracking pixels in sent emails will point to localhost and won't work for real recipients. Change to your production URL before sending real campaigns.

3. **Gmail SMTP limits** — Gmail allows ~500 emails/day for free accounts. For production at scale, switch to SendGrid, Resend, or AWS SES.

4. **Worker is not automatic** — nobody is calling `/api/worker/run` on a schedule yet. Jobs are created when you start a campaign but won't send until the worker runs.

5. **No rate limiting** — the API routes have no rate limiting. Important before going public.

6. **`{{FIRST_NAME}}`** variable — the toolbar has a button to insert it, but the worker doesn't replace it with real data yet when sending. The prospects table has `first_name` — it just needs a string replace in the send step.

7. **Campaign settings are per-campaign** — there's no global default. Each campaign starts with the defaults defined in the settings page code.
