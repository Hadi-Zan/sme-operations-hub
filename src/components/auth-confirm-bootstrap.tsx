"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAuthFragment } from "@/lib/auth-continuation";

export function AuthConfirmBootstrap() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const continuation = parseAuthFragment(window.location.hash);
    window.history.replaceState(null, "", window.location.pathname);

    if (!continuation) {
      void Promise.resolve().then(() => setError(true));
      return;
    }

    void fetch("/auth/confirm/stage", {
      body: JSON.stringify(continuation),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((response) => {
      if (!response.ok) {
        setError(true);
        return;
      }
      router.replace("/auth/continue");
    }).catch(() => setError(true));
  }, [router]);

  return (
    <p role={error ? "alert" : "status"} className={`mt-5 rounded-xl border px-3.5 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {error ? "This authentication link is incomplete or invalid. Request a new link." : "Preparing the secure continuation step…"}
    </p>
  );
}
