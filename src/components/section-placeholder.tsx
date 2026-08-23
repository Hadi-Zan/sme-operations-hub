type SectionPlaceholderProps = {
  title: string;
  description: string;
  plannedItems: readonly string[];
};

export function SectionPlaceholder({
  title,
  description,
  plannedItems,
}: SectionPlaceholderProps) {
  const initials = title.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section aria-labelledby="section-heading" className="border-b border-slate-200 pb-7">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Phase 2 demo feature
        </div>
        <h1
          id="section-heading"
          className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
        >
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.65fr)]">
        <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black tracking-tight text-emerald-300">
            {initials}
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">The {title.toLowerCase()} area is ready</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Navigation and layout are in place. Database functionality is not connected in Phase 2.
          </p>
          <span className="mt-5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            No live data connected
          </span>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Future scope
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Planned, not built</h2>
          <ul className="mt-5 space-y-4">
            {plannedItems.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
