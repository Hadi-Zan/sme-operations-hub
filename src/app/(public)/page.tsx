import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "SME Operations Hub",
  },
  description:
    "A portfolio demonstration of secure, custom workflow automation for small service businesses.",
  openGraph: {
    type: "website",
    url: "https://sme-operations-hub-iota.vercel.app",
    siteName: "SME Operations Hub",
    title: "SME Operations Hub",
    description: "Custom workflow automation for small service businesses.",
    images: [
      {
        url: "https://sme-operations-hub-iota.vercel.app/og.png",
        width: 1672,
        height: 941,
        alt: "SME Operations Hub — custom workflow automation for small service businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SME Operations Hub",
    description: "Custom workflow automation for small service businesses.",
    images: ["https://sme-operations-hub-iota.vercel.app/og.png"],
  },
};

const capabilities = [
  {
    number: "01",
    title: "Operational dashboard",
    description: "A daily view of work, stock, customer commitments, and the issues that need attention.",
  },
  {
    number: "02",
    title: "Attention and alerts",
    description: "A focused queue derived from overdue work, urgent tasks, low stock, and follow-ups.",
  },
  {
    number: "03",
    title: "Tasks and assignments",
    description: "Clear ownership, priorities, due dates, and role-aware status workflows for the team.",
  },
  {
    number: "04",
    title: "Inventory tracking",
    description: "Reorder visibility and an append-only movement history instead of an editable stock total.",
  },
  {
    number: "05",
    title: "Customers and follow-ups",
    description: "Customer records and assigned commitments kept together with useful completion outcomes.",
  },
  {
    number: "06",
    title: "Team and access management",
    description: "Invitation, deactivation, and reactivation flows that preserve operational history.",
  },
] as const;

const workflowPreviews = [
  {
    title: "Attention that stays tied to the work",
    eyebrow: "Prioritise the next action",
    description:
      "Overdue work, urgent commitments, low stock, and customer follow-ups are brought into one review queue without duplicating their source records.",
    src: "/portfolio/attention.png",
    width: 1814,
    height: 867,
    alt: "Sanitized fictional demo showing the SME Operations Hub Attention queue",
  },
  {
    title: "Stock changes with a useful trail",
    eyebrow: "Keep supplies visible",
    description:
      "Inventory balances are calculated from movements, making low-stock conditions clear while retaining the history behind every adjustment.",
    src: "/portfolio/inventory.png",
    width: 1820,
    height: 864,
    alt: "Sanitized fictional demo showing inventory tracking and stock levels",
  },
  {
    title: "Customer promises stay assigned",
    eyebrow: "Follow through consistently",
    description:
      "Follow-ups connect the customer, assignee, due date, notes, and eventual outcome so commitments do not disappear into messages or memory.",
    src: "/portfolio/follow-ups.png",
    width: 1821,
    height: 864,
    alt: "Sanitized fictional demo showing assigned customer follow-ups",
  },
] as const;

const technologies = ["Next.js", "TypeScript", "Supabase / PostgreSQL", "Vercel"] as const;

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/95">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="SME Operations Hub portfolio home"
            className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-black tracking-tight text-emerald-300">
              SO
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-slate-950">
                SME Operations Hub
              </span>
              <span className="block text-xs text-slate-500">Portfolio demonstration</span>
            </span>
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/10">
                Fictional demo data
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Custom workflow automation for SMEs
              </span>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              SME Operations Hub
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
              A secure operations workspace that brings daily work, stock, customer commitments,
              and team access into one clear view.
            </p>
          </div>

          <div className="border-l-2 border-emerald-300 pl-5 sm:pl-6">
            <p className="text-sm leading-6 text-slate-600">
              This portfolio project demonstrates the kind of focused internal system that can
              replace fragmented spreadsheets, chat threads, paper notes, and individual memory
              for a small service business.
            </p>
            <Link
              href="#capabilities"
              className="mt-5 inline-flex rounded-lg text-sm font-semibold text-emerald-800 outline-none transition hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Explore the workflows
            </Link>
          </div>
        </div>

        <figure className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:mt-12 sm:rounded-3xl sm:p-2.5">
          <Image
            src="/portfolio/dashboard.png"
            alt="Sanitized fictional demo showing the SME Operations Hub operational dashboard"
            width={1821}
            height={864}
            priority
            sizes="(max-width: 1536px) 100vw, 1376px"
            className="h-auto w-full rounded-xl sm:rounded-2xl"
          />
          <figcaption className="sr-only">
            The dashboard brings tasks, stock, follow-ups, and operational attention together.
          </figcaption>
        </figure>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          All names, business records, counts, and scenarios shown on this page are fictional demo data.
        </p>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-heading" className="bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              What was built
            </p>
            <h2 id="capabilities-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              One operational picture, backed by real workflows
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The application is intentionally focused on the daily coordination problems a small
              service team needs to solve clearly and consistently.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((capability) => (
              <article key={capability.number} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-bold text-emerald-300">
                  {capability.number}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
                  {capability.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Selected workflows
            </p>
            <h2 id="workflow-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Designed around the next useful action
            </h2>
          </div>

          <div className="mt-10 space-y-6 sm:space-y-8">
            {workflowPreviews.map((preview, index) => (
              <article
                key={preview.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:grid lg:grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)] lg:items-center"
              >
                <div className={`p-6 sm:p-8 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    {preview.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950">
                    {preview.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{preview.description}</p>
                </div>
                <div className={`border-t border-slate-200 bg-slate-950 p-1.5 lg:border-t-0 ${index % 2 === 1 ? "lg:order-1 lg:border-r" : "lg:border-l"}`}>
                  <Image
                    src={preview.src}
                    alt={preview.alt}
                    width={preview.width}
                    height={preview.height}
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="h-auto w-full rounded-xl"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.55fr)] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Built as a secure full-stack application
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              A public overview, with private operations behind it
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
              The working operational application remains authenticated. Workspace reads and
              mutations continue to use server-side authorization and database-level access controls.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {technologies.map((technology) => (
                <span key={technology} className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-semibold text-slate-200">
                  {technology}
                </span>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-slate-950 outline-none transition hover:bg-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Sign in to the application
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-semibold text-slate-700">SME Operations Hub</p>
          <p>Portfolio/demo deployment. All displayed business data is fictional.</p>
        </div>
      </footer>
    </main>
  );
}
