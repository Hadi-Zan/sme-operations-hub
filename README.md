# SME Operations Hub

A straightforward operations workspace for a single small service business. Phase 6 adds live operational attention and an in-app daily digest to the existing Supabase authentication, workspace, task, inventory, customer, and follow-up foundation.

## Current scope

- Secure email/password sign-in and sign-out with Supabase Auth
- Server-validated, cookie-based sessions and protected Next.js routes
- One configured workspace per deployment
- An owner-editable business profile backed by PostgreSQL and Row Level Security
- Workspace tasks with owner management, member status updates, assignment, priority, due dates, filtering, and search
- Live task and attention dashboard summaries
- Workspace inventory with owner-managed item metadata, member stock recording, low-stock filtering, and immutable movement history
- Live low-stock inventory attention
- Workspace customers with practical contact details, operational notes, search, and reversible deactivation
- Customer-linked follow-ups with assignment, workspace-local due dates and times, completion outcomes, and retained history
- Live Follow-ups dashboard summary
- A workspace-scoped Attention page for overdue tasks, urgent tasks due today, low stock, overdue follow-ups, and follow-ups due today
- Per-user acknowledgement state that remains separate from source resolution
- A fully live in-app daily operations digest and unacknowledged navigation count
- No public signup, password recovery, invitations, external messaging, AI, billing, cron jobs, or email delivery

## Technology

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- ESLint
- npm

## Local development

Install Node.js 24 LTS, then install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and replace the placeholders with values from the Supabase project Connect dialog and the local application origin:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SECRET_KEY=sb_secret_your_server_only_key
APP_BASE_URL=http://localhost:3000
```

`SUPABASE_SECRET_KEY` is server-only: never give it a `NEXT_PUBLIC_` prefix or expose it to browser code. `.env.local` is ignored by Git. Production must set `APP_BASE_URL` to the canonical HTTPS origin.

After completing the Supabase setup below, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a hosted Supabase project in an appropriate region and securely retain its database password.
2. In **Authentication → Providers → Email**, enable email/password authentication, disable public user signup, and keep anonymous sign-ins disabled.
3. In **Authentication → URL Configuration**, set the production Site URL and add `http://localhost:3000/**` as an allowed development redirect URL.
4. In **Authentication → Password Security**, require at least eight characters and configure the strongest practical password rules. Enable leaked-password protection when available on the project plan.
5. In the Email provider settings, set **Email OTP Expiration** to `3600` seconds for production. This shared setting also limits invitation, confirmation, and password-recovery links; the application keeps its separate 24-hour invitation eligibility and supports resend.
6. Configure custom SMTP before production; Supabase's default mail service is for development only.
7. Open the Supabase SQL Editor and run these migrations in order:
   1. `supabase/migrations/20260823000000_phase_2_auth_foundation.sql`
   2. `supabase/migrations/20260824000000_phase_3_tasks.sql`
   3. `supabase/migrations/20260825000000_phase_4_inventory.sql`
   4. `supabase/migrations/20260825160000_phase_5_customers_follow_ups.sql`
   5. `supabase/migrations/20260825210000_phase_6_operations_attention.sql`
   6. `supabase/migrations/20260826000000_phase_7a_team_auth_lifecycle.sql`
   7. `supabase/migrations/20260827094248_phase_7b_production_hardening.sql`
8. In **Authentication → Users**, create the initial email/password user and ensure the email is confirmed. Copy the user's UUID.
9. In the SQL Editor, run the following statement once after replacing the placeholder values:

```sql
with configured_workspace as (
  insert into public.workspaces (
    name,
    contact_email,
    contact_phone,
    address,
    timezone
  )
  values (
    'Your Business Name',
    'operations@example.com',
    '+65 6000 0000',
    'Your business address',
    'Asia/Singapore'
  )
  returning id
)
insert into public.workspace_members (workspace_id, user_id, role, display_name)
select id, 'AUTH_USER_UUID'::uuid, 'owner', 'Workspace Owner'
from configured_workspace;
```

8. Add the Project URL and publishable key to `.env.local` and to the deployment platform's environment-variable settings.
9. Review the Supabase Security Advisor. Do not disable RLS or add broad anonymous grants to clear findings.

The migration contains schema and policies only. Never commit real user credentials, customer information, or populated environment files.

## Quality checks

```bash
npm run test
npm run lint
npm run build
```

The repeatable RLS checks in `supabase/tests/workspace_rls.sql`, `supabase/tests/tasks_rls.sql`, `supabase/tests/inventory_rls.sql`, `supabase/tests/customers_follow_ups_rls.sql`, and `supabase/tests/operations_attention_rls.sql` are designed for a non-production Supabase project and roll back their temporary test data.
