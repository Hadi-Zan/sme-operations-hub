# SME Operations Hub demo script

- **Target length:** 4 minutes 20 seconds
- **Audience:** hiring manager, technical interviewer, or SME owner
- **Demo account:** workspace owner

The production demo contains fictional data but is connected to a live demo database. Keep the walkthrough read-only: open filters and records, but do not submit forms, acknowledge conditions, complete work, change stock, invite employees, or deactivate accounts unless the demo data has been reset and that change is intentional.

## Before presenting

- Sign in before screen sharing and start on the Dashboard.
- Use a desktop-width window and hide password managers, developer tools, email, and environment settings.
- Do not show the sign-in password, browser storage, Supabase dashboard, Vercel environment variables, or Mailtrap credentials.
- If a number differs from this script, describe the category rather than memorising the count; the dashboard is derived from current demo state.

## Walkthrough

### 1. Dashboard — orient the audience

**Timing:** 0:00–0:40 (40 seconds)

**What to click**

1. Start on **Dashboard**.
2. Point to the five summary cards.
3. Point to **What needs attention now**, then hover over **Open Attention** without clicking yet.

**What to say**

> “This is the owner's daily starting point. It combines work, stock, customer commitments, and operational attention in one view. The cards give a quick health check, while the dark panel ranks the conditions that need a decision now. These are live summaries from the same database records used throughout the workspace, not a separate report.”

**Business problem demonstrated**

The owner no longer has to reconcile spreadsheets and messages just to understand today's operational state.

### 2. Attention — turn signals into a review queue

**Timing:** 0:40–1:20 (40 seconds)

**What to click**

1. Click **Attention** in the sidebar.
2. Point to the condition summary and **Operations preview**.
3. Open the scope, acknowledgement, category, and severity filters, but do not apply a state-changing action.
4. Point to an **Open tasks**, **Open inventory**, or **Open follow-ups** link.

**What to say**

> “Attention is a derived queue across overdue work, urgent tasks due today, low stock, and customer follow-ups. Owners can review the whole workspace; members default to their own relevant items. Acknowledgement records that someone has reviewed a condition, but it does not pretend the problem is solved—the source task, stock level, or follow-up must actually change.”

**Business problem demonstrated**

Important exceptions become a focused queue with traceability instead of disappearing in a general list.

### 3. Tasks — clarify ownership and execution

**Timing:** 1:20–2:00 (40 seconds)

**What to click**

1. Click **Tasks**.
2. Show status, priority, and search filters.
3. Point to an assigned task, its priority, due date, and status control.
4. Point to **New task** and **Edit**, but do not submit a change.

**What to say**

> “Owners can create, assign, edit, and delete tasks. Employees can see workspace work but can only move the status of tasks assigned to them. Due dates use the workspace timezone, and urgent work due today feeds directly into Attention.”

**Business problem demonstrated**

Responsibility is explicit, progress is visible, and members can update execution without receiving broad management permissions.

### 4. Inventory — preserve a trustworthy stock history

**Timing:** 2:00–2:40 (40 seconds)

**What to click**

1. Click **Inventory**.
2. Point to the low-stock summary and the **Kickboards** stock badge.
3. Point to **Record movement** and **History**.
4. Scroll just enough to show **Recent stock movements** if it is not visible.

**What to say**

> “Stock is not stored as an editable number. The current balance is derived from stock-in, stock-out, and adjustment movements, so the history is preserved. Owners define the item and reorder threshold, while active team members can record real-world movements. Low balances automatically appear in Attention.”

**Business problem demonstrated**

The business gains a simple audit trail and earlier reorder visibility without a heavyweight inventory platform.

### 5. Customers and follow-ups — keep promises visible

**Timing:** 2:40–3:30 (50 seconds)

**What to click**

1. Click **Customers** and point to search, contact context, and pending follow-up information.
2. Click **Follow-ups**.
3. Point to overdue, due-today, upcoming, and completed summaries.
4. Point to a follow-up's customer, assignee, due date, **Complete** control, and outcome workflow without submitting it.

**What to say**

> “Customer records provide the context, while follow-ups turn a promise into owned work with a date and optional time. Completing a follow-up requires an outcome, so the team keeps useful history rather than just ticking a box. Customers can be deactivated without deleting prior commitments.”

**Business problem demonstrated**

Customer promises stop living in one person's memory, and the business retains the outcome of each contact.

### 6. Team — show the employee lifecycle

**Timing:** 3:30–4:10 (40 seconds)

**What to click**

1. Click **Settings**, then **Manage team**.
2. Point to **Invite an employee**, but leave both fields blank.
3. Point to the member's Active status, editable display name, and **Deactivate** control.
4. Point to **Invitation history** if it is visible; do not resend, cancel, invite, or deactivate during the portfolio walkthrough.

**What to say**

> “Team access has a lifecycle rather than a delete button. The owner can invite employees, resend or cancel pending invitations, update display names, and deactivate or reactivate members. Deactivation immediately removes workspace access and unassigns open work, while completed work and audit references remain intact. The database also prevents removal of the final active owner.”

**Business problem demonstrated**

Onboarding and offboarding are handled deliberately, without losing operational history or leaving stale access behind.

### Close

**Timing:** 4:10–4:20 (10 seconds)

**What to click**

Return to **Dashboard**.

**What to say**

> “This is a portfolio demonstration of custom SME workflow automation: one operational record, role-aware actions, and a clear daily attention loop. A real rollout would start with the client's exact workflow, data, compliance, and integration requirements.”

**Business problem demonstrated**

The system is a focused custom foundation, not a claim that every SME works the same way.

## If time is cut to three minutes

Keep Dashboard, Attention, Inventory, Follow-ups, and Team. Summarise Tasks while pointing to the Dashboard's task metrics, and mention Customers as the source context for Follow-ups.
