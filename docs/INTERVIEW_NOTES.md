# SME Operations Hub interview notes

These are talking points, not lines to memorise. Keep the answers conversational and adapt the depth to the interviewer.

## “Give me the short version.”

“SME Operations Hub is a portfolio project for a small service business that has outgrown spreadsheets and chat-based coordination. I built one secure workspace for tasks, inventory, customers, follow-ups, operational attention, and employee access. The front end is Next.js and React on Vercel; Supabase provides Auth and PostgreSQL with workspace-scoped RLS.”

## “Is this used by a real customer?”

“No. It is a fictional, login-protected portfolio deployment with sample data. I designed it to demonstrate the engineering and product decisions I would bring to a real SME engagement, but I would do client discovery, security/privacy review, production email, monitoring, backups, and user acceptance work before any real rollout.”

## “What business problem were you solving?”

“Small teams often split operational state across spreadsheets, messages, and memory. That creates missed commitments, unclear ownership, weak stock history, and inconsistent offboarding. I wanted the product to make today's exceptions obvious without forcing a small business into an enterprise-sized system.”

## “What is the strongest product decision?”

“Attention is the strongest decision. It is not another manually maintained inbox; it is derived from the actual task, stock, and follow-up state. Acknowledgement means ‘I reviewed this,’ while only resolving the source removes the condition. That keeps review state and operational truth separate.”

## “Why Next.js Server Components?”

“Most pages are authenticated, data-heavy views. Server Components let me resolve the account and fetch permitted data on the server, then send rendered HTML rather than build a client-side loading layer for every route. I use client components only where forms, dialogs, or pending state need browser interactivity.”

## “Why Server Actions instead of API routes?”

“The mutations are tightly coupled to forms in the Next.js application. Server Actions give me a small typed server boundary for parsing input, checking role or assignment rules, writing through Supabase, and revalidating affected pages. The database still enforces authorization, so the action is not treated as the only security control.”

## “How does authorization work?”

“Supabase Auth establishes identity, but roles and active membership live in PostgreSQL. The application checks the current account for useful fail-closed behavior, and RLS checks workspace and role rules again at the data boundary. Constraints and triggers handle invariants such as active assignees and the final active owner.”

## “Why both server checks and RLS?”

“They solve different problems. Server checks make the product behavior clear and prevent obviously invalid operations early. RLS protects the data if a route is buggy or a caller reaches the Data API another way. I want a mistake in one layer to meet another independent boundary.”

## “What can owners and members do?”

“Owners manage task details, inventory items, customers, follow-up schedules, workspace settings, and the team lifecycle. Members can read permitted workspace data, record inventory movements, update the status of assigned tasks, and complete or reopen assigned follow-ups. Attention acknowledgement is per user.”

## “Why is inventory movement-based?”

“An editable quantity tells me the current number but not why it changed. I store stock-in, stock-out, and adjustment movements and derive the balance. Corrections are new adjustments, so the history remains explainable. The trade-off is slightly more database logic, which is worthwhile for auditability.”

## “How does Attention avoid stale acknowledgements?”

“Each derived condition has a fingerprint based on its source episode, including fields such as the due date or source update state. The acknowledgement points to that exact fingerprint. If the source changes and later becomes a problem again, an old acknowledgement does not silently carry forward.”

## “What was difficult about employee invitations?”

“The email can map to no Auth user, an unconfirmed user, or a confirmed existing user, and provider calls can partially fail or race. I modelled the invitation lifecycle in the database and isolated the Auth Admin work in a server-only module. The delivery code validates normalized emails and returned identities, fails closed on ambiguity, and stores only sanitized error categories.”

## “Why not delete a user when they leave?”

“Deletion would damage history and is not the same as revoking business access. I deactivate the workspace membership. Authorization checks active status on each request, open assignments are cleared, and completed work and audit references remain. A database trigger also prevents the final active owner from being removed.”

## “What is the server-only admin client?”

“Normal reads and writes use the user's session and RLS. Auth invitation delivery needs Supabase Admin capabilities, so there is a separate client in a `server-only` module using the secret key. Its scope is narrow: Auth user lookup, invitation or magic-link delivery, and trusted invitation-delivery recording. It is never available to browser code.”

## “How did you secure Auth links?”

“Invitation and recovery token hashes arrive in a URL fragment. A same-origin staging route validates the shape and moves the value into a short-lived, `HttpOnly`, path-scoped cookie; the visible fragment is removed before a Server Action verifies it once. Sensitive Auth routes also use a no-referrer policy.”

## “How do you handle dates and timezones?”

“The business's workspace timezone is authoritative. It is validated against PostgreSQL timezone names, and overdue or due-today calculations use the workspace-local date. That prevents the browser, Vercel region, or database server timezone from changing what ‘today’ means operationally.”

## “How did you test it?”

“There are 61 Vitest tests across 10 files for domain logic and security-sensitive seams, plus seven transactional SQL regression suites for RLS and database invariants. I also run ESLint and the production Next.js build, then verify owner/member/Auth journeys and responsive behavior against the deployment.”

## “What technical problem are you proudest of?”

“The employee lifecycle is probably the deepest because it crosses UI state, Auth provider behavior, database authorization, data retention, and partial failures. The Attention episode model is the most product-visible piece. Together they show the balance I wanted: simple interface, careful state model underneath.”

## “What trade-offs did you make?”

“I kept it as a focused single-workspace-per-user demo, used only owner and member roles, and left scheduled email digests, ownership transfer, public signup, and third-party integrations out. Those choices kept the build coherent. For a real client, I would add only the workflows justified by discovery.”

## “What would you change for a real SME?”

“First I would map their actual roles, vocabulary, approvals, data, reports, retention, and integrations. Then I would add separate environments, production SMTP, observability, backups and restore drills, client-specific security/privacy controls, data migration, acceptance testing, and support procedures. I would not present this demo as a drop-in production system.”

## “What did you learn?”

“The main lesson was that workflow products are mostly about lifecycle and exceptions. A task list is easy; preserving who can act, what happens when a person leaves, how a condition reappears, and which history must survive is where the real design work is.”
