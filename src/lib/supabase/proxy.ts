import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseConfig,
  getSupabaseCookieOptions,
} from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";
const PUBLIC_PATHS = new Set([
  "/",
  LOGIN_PATH,
  "/forgot-password",
  "/auth/confirm",
  "/auth/confirm/stage",
  "/auth/continue",
  "/auth/error",
]);

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function redirectWithResponseState(response: NextResponse, url: URL) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(headerName);
    if (value) redirectResponse.headers.set(headerName, value);
  }

  return redirectResponse;
}

function loginUrl(request: NextRequest, notice?: string) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  if (notice) url.searchParams.set("notice", notice);
  return url;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  const isLoginRoute = request.nextUrl.pathname === LOGIN_PATH;
  const isPublicRoute = isPublicPath(request.nextUrl.pathname);

  if (!config) {
    return isPublicRoute
      ? NextResponse.next()
      : NextResponse.redirect(loginUrl(request, "configuration"));
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(config.url, config.publishableKey, {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getClaims();
    const isAuthenticated = !error && Boolean(data?.claims?.sub);

    if (!isAuthenticated && !isPublicRoute) {
      return redirectWithResponseState(response, loginUrl(request));
    }

    if (isAuthenticated && isLoginRoute) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = DASHBOARD_PATH;
      dashboardUrl.search = "";
      return redirectWithResponseState(response, dashboardUrl);
    }

    return response;
  } catch {
    return isPublicRoute
      ? response
      : redirectWithResponseState(response, loginUrl(request, "unavailable"));
  }
}
