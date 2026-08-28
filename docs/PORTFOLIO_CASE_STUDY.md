# SME Operations Hub — portfolio case study

## Project context

SME Operations Hub is a self-directed portfolio project. It is not a real customer deployment, and all demonstration business data is fictional. I built it to show how I would translate common small-business operations into a secure, maintainable custom workflow application.

## Problem

Small service businesses often run daily operations across spreadsheets, chat threads, paper notes, and individual memory. Those tools can work at low volume, but the seams become costly: tasks lose owners, stock changes lack history, customer promises are missed, and employee access is not always removed cleanly.

The design goal was not to reproduce an enterprise platform. It was to create a focused operational workspace that makes the next action clear while retaining enough history and access control to be credible.

## Target user

The primary user is an owner or operations lead at a small service business with:

- a small team of employees;
- recurring tasks and customer commitments;
- lightweight stock or supplies to monitor;
- a need for clear onboarding and offboarding; and
- limited appetite for complex enterprise software.

The fictional demo uses a swim-school scenario, but the workflows could map to tuition, wellness, maintenance, home services, studios, clinics, or other appointment- and relationship-driven businesses after proper discovery.

## What I built

I built a full-stack, login-protected web application with:

- a daily operations Dashboard;
- a live Attention queue derived from tasks, inventory, and follow-ups;
- role-aware task assignment and status workflows;
- an append-only inventory movement ledger with derived balances;
- customer records with reversible deactivation;
- assigned customer follow-ups with required completion outcomes;
- employee invitation, acceptance, resend, cancellation, deactivation, and reactivation flows;
- password recovery and secure Auth-link continuation; and
- workspace-scoped authorization enforced in both the application and database.

The user interface is mobile-first, semantic, keyboard-aware, and intentionally calm. Data-heavy routes use React Server Components; mutations use Next.js Server Actions.

## Key workflows

### Daily review loop

The owner opens the Dashboard, scans work/stock/customer metrics, and moves into Attention. Attention is a database-derived projection of active conditions, so it stays aligned with the source records. A user can acknowledge that they reviewed a condition, but the condition only disappears when its source is resolved.

### Delegated task execution

Owners manage task details and assignments. Members can read workspace tasks but may only update the status of tasks assigned to them. The restriction exists in the Server Action and at the database boundary.

### Inventory ledger

Items hold descriptive metadata and a reorder threshold. Stock level is calculated from movements rather than edited directly. Corrections are new adjustment movements, preserving the audit trail. Active members can record movements; item configuration remains owner-controlled.

### Customer commitments

Owners create customer records and schedule follow-ups. A follow-up links the customer, owner or member assignee, due date, optional time, notes, and eventual outcome. Owners or assigned members can complete or reopen actionable follow-ups. Deactivating a customer prevents new follow-ups without erasing history.

### Employee lifecycle

The owner can invite an employee whether the email belongs to a new, confirmed, or still-unconfirmed Supabase Auth user. Invitations have explicit lifecycle state, expiry, resend/cancel behavior, and sanitized delivery errors. Deactivating a member blocks workspace access and clears open assignments while retaining completed-work and audit references. The final active owner is protected by a database invariant.

## Security decisions

I treated browser visibility, server authorization, and database authorization as separate layers:

- Identity comes from Supabase Auth; role and active membership come from database rows rather than user-editable metadata.
- The Next.js proxy refreshes sessions and redirects unauthenticated requests away from private routes.
- Server Components resolve a verified user and active workspace context before reading data.
- Server Actions validate untrusted form input and check owner/member permissions.
- PostgreSQL grants and RLS policies scope every exposed row operation to the active workspace and permitted role.
- Constraints and triggers enforce invariants that should survive application bugs or alternate API callers.
- The Supabase secret key exists only in a `server-only` module and is used narrowly for Auth administration and trusted invitation-delivery recording.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and secure in production.
- Auth tokens from invitation and recovery links are moved into a short-lived, path-scoped cookie and verified once; sensitive Auth routes use a no-referrer policy.
- Errors returned to the interface are generic, while stored provider error categories are bounded and sanitized.

This is a strong demo security model, not a certification or guarantee. A real deployment would still require a client-specific threat model, privacy review, operational monitoring, and independent testing.

## Difficult technical problems solved

### 1. Making attention live without duplicating business state

I modelled Attention as a security-invoker PostgreSQL view over tasks, inventory balances, customers, and follow-ups. Each active condition gets a fingerprint based on the source episode. Acknowledgements reference that exact fingerprint, so changing and later re-entering a condition does not incorrectly inherit an old acknowledgement.

### 2. Preserving an immutable stock trail

Inventory balances are derived from append-only movements. Database checks validate movement types and quantities, adjustments require notes, and corrections create a new movement. This avoids the ambiguity of a directly editable stock number.

### 3. Handling invitation identity states safely

Supabase invitation behavior differs for absent, unconfirmed, and confirmed Auth users. The server-only delivery layer classifies those states, validates returned identities and normalized emails, handles replacement races conservatively, and records only sanitized outcomes. Tests cover the branch and failure behavior, including the rule that the application never deletes Auth users to “repair” an invitation.

### 4. Enforcing offboarding despite a stale session

Deleting an Auth user was not an acceptable lifecycle model because history and ownership matter. Instead, active status is part of the authorization check. Deactivation unassigns open tasks and pending follow-ups, preserves completed/audit references, and blocks workspace access even if an existing browser session remains valid at the Auth layer.

### 5. Keeping date-based operations correct

Overdue and due-today conditions use the workspace's validated PostgreSQL timezone. That keeps the Dashboard, Attention, Tasks, and Follow-ups aligned for the business rather than depending on the deployment server or browser timezone.

## Testing

The automated application suite contains 61 passing Vitest tests across 10 files. It focuses on business decisions and security-sensitive seams: attention filtering and episode fingerprints, invitation delivery branches, Auth continuation parsing, cookie flags, production URL validation, error sanitization, and formatting.

Seven transactional SQL regression suites cover workspace isolation, RLS permissions, role boundaries, task and follow-up assignment rules, inventory behavior, Attention acknowledgements, employee lifecycle invariants, and database hardening. These scripts create fixtures inside a transaction and roll them back; they are for isolated non-production Supabase projects only.

The release checks also include ESLint, the production Next.js build, and owner/member/Auth workflow verification against the deployed demo.

## Deployment

The Next.js application is deployed on Vercel. Supabase hosts Auth and PostgreSQL, including the Data API, functions, views, triggers, and RLS policies. Supabase Auth email is routed to Mailtrap Email Sandbox for demonstration, so invitation and recovery messages are not delivered as production email.

The live demo is available at [sme-operations-hub-iota.vercel.app](https://sme-operations-hub-iota.vercel.app). It is login-protected; credentials are shared privately and are not stored in the repository.

## What I learned

- A small operational product benefits from modelling exceptions and lifecycle states explicitly rather than adding more dashboard widgets.
- RLS is most useful when it expresses the same ownership rules as the product, with database constraints covering invariants that policies alone cannot protect.
- Employee offboarding is a data-retention problem as much as an authentication problem.
- Invitation flows need careful treatment of provider state, retries, identity matching, expiry, and partial failure.
- Workspace-local dates should be a domain decision, not an incidental property of the browser or server.
- A calm interface can still expose serious operational and security behavior without becoming enterprise-heavy.

## How this could be customised for a real SME

A real engagement would begin with workflow discovery rather than installing this demo unchanged. I would map the client's vocabulary, roles, approval steps, customer journey, stock units, exception rules, reports, and retention needs, then remove or reshape anything that does not earn its place.

Likely customisation areas include:

- industry-specific task and customer fields;
- different staff roles and approval limits;
- recurring work, service schedules, or job templates;
- client-specific Attention rules and escalation thresholds;
- imports from existing spreadsheets and a verified migration plan;
- operational reports and exports;
- integration with the client's accounting, booking, messaging, or inventory tools;
- production email, branding, domains, monitoring, backups, audit retention, and support; and
- security, privacy, availability, accessibility, and compliance requirements appropriate to the client.

Those additions are production discovery items, not features claimed by this portfolio build.
