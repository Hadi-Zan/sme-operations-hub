import { signOut } from "@/app/(auth)/login/actions";

type SignOutButtonProps = {
  variant?: "card" | "desktop" | "mobile";
};

export function SignOutButton({ variant = "desktop" }: SignOutButtonProps) {
  const className =
    variant === "card"
      ? "rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      : variant === "mobile"
        ? "rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
        : "mt-2 text-left text-[11px] font-semibold text-slate-500 outline-none transition hover:text-slate-200 focus-visible:text-slate-200";

  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
