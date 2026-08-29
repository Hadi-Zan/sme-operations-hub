# LinkedIn post drafts

## Concise version

I’ve finished SME Operations Hub, a portfolio project demonstrating custom workflow automation for small service businesses.

It brings tasks, inventory, customers, follow-ups, operational attention, and employee access into one login-protected workspace. The goal was simple: make daily priorities visible without turning a small team’s process into enterprise software.

Built with Next.js, React, Supabase Auth/PostgreSQL, Row Level Security, and Vercel.

Public project overview: https://sme-operations-hub-iota.vercel.app

This is a fictional portfolio deployment with sample data—not a real customer system. Demo access is shared privately.

#Nextjs #Supabase #TypeScript #PortfolioProject #SME

## Slightly more technical version

I’ve completed SME Operations Hub, a full-stack portfolio project exploring how a custom application can support the daily workflows of a small service business.

The application includes:

- a live operations dashboard and derived Attention queue;
- role-aware tasks and customer follow-ups;
- append-only inventory movements with calculated balances;
- customer lifecycle controls; and
- employee invitation, deactivation, and reactivation workflows.

The stack is Next.js 16, React 19, strict TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL, workspace-scoped Row Level Security, and Vercel. I used Server Components for authenticated reads, Server Actions for validated mutations, database constraints/triggers for critical invariants, and a narrowly scoped server-only admin client for Auth invitation delivery.

The interesting engineering work was less about CRUD and more about lifecycle: keeping acknowledgements tied to the correct attention episode, preserving an immutable stock trail, handling new/unconfirmed/existing Auth users safely, and blocking deactivated members even when an older Auth session still exists.

Public project overview: https://sme-operations-hub-iota.vercel.app

This is a fictional portfolio deployment with sample data and sandboxed email—not a real customer production system. The working application remains login-protected, no credentials are published, and access is shared privately.

#Nextjs #React #Supabase #PostgreSQL #TypeScript #SoftwareEngineering
