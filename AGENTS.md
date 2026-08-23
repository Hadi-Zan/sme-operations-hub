<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SME Operations Hub development rules

These rules apply to the entire repository in addition to the generated Next.js rules above.

## Product boundaries

- Build only the phase or feature explicitly requested. Do not anticipate later product phases with speculative infrastructure.
- Phase 1 is front-end only. All displayed business information must be static sample data and clearly identifiable as such.
- Do not add Supabase, authentication, email, cron jobs, payments, AI, Telegram, WhatsApp, or other integrations until they are explicitly requested.
- Keep the product focused on straightforward operations for small service businesses.

## Stack and dependencies

- Use the Next.js App Router, strict TypeScript, Tailwind CSS, and ESLint.
- Use npm and commit `package-lock.json` whenever dependencies change.
- Prefer React, Next.js, browser APIs, and CSS over new packages. Add a dependency only when it materially reduces risk or complexity.
- Use Server Components by default. Add `"use client"` only where browser state, effects, or event handlers are required.

## Project organization

- Keep routes in `src/app` and reusable interface pieces in `src/components`.
- Keep sample or shared static data in `src/lib` until a real data layer is introduced.
- Keep route files focused on composition; move repeated interface patterns into named components.
- Use `next/link` for internal navigation and the Next.js metadata API for page metadata.

## Interface quality

- Design mobile-first and verify layouts remain usable from small phones through desktop screens.
- Use semantic HTML, visible focus states, sufficient contrast, descriptive labels, and appropriate ARIA attributes.
- Clearly label demo or placeholder information so it cannot be mistaken for live business data.
- Prefer calm, practical visual design over decorative effects or unnecessary animation.

## Code quality

- Keep TypeScript strict and avoid `any` unless an external boundary makes it unavoidable and the reason is documented.
- Avoid duplicated constants, magic values, and oversized components when a small local extraction improves clarity.
- Run `npm run lint` and `npm run build` after meaningful implementation work and fix failures before handoff.
- Add tests when business rules or interactive behavior are introduced; do not add a test framework solely for static placeholders.

## Security and repository hygiene

- Never commit secrets, credentials, personal customer data, or populated environment files.
- Document future environment variables in `.env.example` with non-sensitive placeholders.
- Do not commit, push, rewrite Git history, or modify remotes unless the user explicitly requests it.
