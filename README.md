# SME Operations Hub

SME Operations Hub is a portfolio/demo application showing how a customised internal workflow system can help a small service business coordinate daily work. It brings tasks, stock, customers, follow-ups, operational attention, and team access into one calm workspace.

## Business problem

Small teams often manage staff responsibilities, inventory, customer commitments, and access changes across disconnected spreadsheets, messages, and memory. The result is missed follow-ups, unclear ownership, late work, and low stock discovered too late. SME Operations Hub keeps these operational signals together and makes the next action visible.

## Core features

- Operations dashboard with live task, inventory, follow-up, and attention summaries
- In-app Attention digest derived from current database state
- Tasks with priorities, due dates, assignments, filtering, and member status updates
- Inventory ledger with immutable movement history, derived balances, and low-stock alerts
- Customer records with contact context and reversible deactivation
- Customer follow-ups with ownership, due dates, completion history, and outcomes
- Employee invitations for new, existing confirmed, and existing unconfirmed accounts
- Invitation resend and cancellation workflows
- Employee deactivation and reactivation with stale-session enforcement
- Password recovery and reset flows
- Owner/member authorization, including owner-only Team controls

## Architecture

- Next.js 16 App Router, React, strict TypeScript, and Tailwind CSS
- Server Components for data-heavy pages and Server Actions for mutations
- Vercel deployment
- Supabase Auth and PostgreSQL
- Workspace-scoped Row Level Security (RLS)
- A server-only Supabase admin client for trusted Auth operations such as invitation delivery and account lookup

## Security model

The application combines PostgreSQL RLS with server-side authorization. Data access is scoped to a workspace, owner/member roles control privileged operations, and deactivated memberships are enforced even when an older browser session still exists. The Supabase secret key is isolated to server-only modules and is never exposed through a `NEXT_PUBLIC_` variable.

Public signup and anonymous sign-in are disabled for the demo project. Auth links use a short-lived continuation flow that stages the token outside the visible URL and verifies it once with Supabase. Sensitive Auth routes return `Referrer-Policy: no-referrer`. These controls reduce common risks but are not a guarantee of security; a real deployment still requires environment-specific review, monitoring, and operational controls.

## Live demo

[Open the portfolio deployment](https://sme-operations-hub-iota.vercel.app)

The deployment is login-protected and contains fictional demo data only. Demo access should be shared privately rather than publishing credentials. Auth email delivery currently uses Mailtrap Email Sandbox, so this environment is not intended for real customers or production email delivery.

## Automation and attention

The in-app operational digest is live. It is calculated from current task, inventory, and follow-up state whenever the workspace is viewed. A scheduled email digest or Cron job is intentionally outside this portfolio version.

## Local setup

1. Install Node.js 24 LTS and dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide values for these variables:

   | Variable | Scope |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Public/client-safe Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public/client-safe publishable key |
   | `SUPABASE_SECRET_KEY` | Server-only secret; never expose to client code or previews |
   | `APP_BASE_URL` | Server-only canonical application origin; use `http://localhost:3000` locally |

3. Create an isolated Supabase project and apply every SQL file in `supabase/migrations` in filename order.

4. Enable the Email/Password provider, keep public signup and anonymous sign-in disabled, and add this exact local Auth redirect:

   ```text
   http://localhost:3000/auth/confirm
   ```

5. Create and confirm the initial Auth user, then create a workspace and matching owner membership using that user ID. Use fictional data in development.

6. Start the application:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

Never commit `.env.local`, credentials, Auth tokens, or real customer information.

## Quality checks

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Transactional RLS regression suites are in `supabase/tests`. Run them only against an isolated development project; every suite is designed to roll back its fixtures.

## Portfolio and production disclaimer

This repository and its live deployment are a portfolio demonstration, not a customer production environment. A real client deployment should use an isolated Supabase project for each environment or client, real SMTP with a verified sending domain, production monitoring and backups, and security/compliance configuration appropriate to the business and data involved.
