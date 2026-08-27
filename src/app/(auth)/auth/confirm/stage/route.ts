import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_CONTINUATION_COOKIE,
  AUTH_CONTINUATION_MAX_AGE_SECONDS,
  encodeAuthContinuation,
  parseAuthFragment,
} from "@/lib/auth-continuation";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let candidate: unknown;
  try {
    candidate = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!candidate || typeof candidate !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const value = candidate as Record<string, unknown>;
  const continuation = parseAuthFragment(
    `token_hash=${typeof value.tokenHash === "string" ? value.tokenHash : ""}&type=${typeof value.type === "string" ? value.type : ""}`,
  );
  if (!continuation) return NextResponse.json({ ok: false }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  response.headers.set("cache-control", "no-store");
  response.cookies.set(AUTH_CONTINUATION_COOKIE, encodeAuthContinuation(continuation), {
    httpOnly: true,
    maxAge: AUTH_CONTINUATION_MAX_AGE_SECONDS,
    path: "/auth",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
