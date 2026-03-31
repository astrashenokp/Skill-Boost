import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — runs on every request before the page renders.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session token (keep cookies in sync).
 *  2. Guard all routes under /app/* and /admin/* — redirect to /login
 *     if there is no authenticated session.
 *  3. Redirect already-authenticated users away from /login and /register.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Apply cookies to the request first (so the server client can read them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Re-create the response with updated request cookies
          supabaseResponse = NextResponse.next({ request });
          // Then apply cookies to the response (sent back to the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A subtle bug can make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Protected routes ──────────────────────────────────────────────────────
  // Any path that starts with /app or /admin requires authentication.
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Preserve the intended destination so we can redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth routes ───────────────────────────────────────────────────────────
  // Logged-in users should not see /login or /register.
  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/app/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // ── Root redirect ─────────────────────────────────────────────────────────
  // Send visitors at "/" to the appropriate place.
  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = user ? "/app/dashboard" : "/login";
    return NextResponse.redirect(target);
  }

  // IMPORTANT: return supabaseResponse — not NextResponse.next() — so that
  // the refreshed session cookies are forwarded to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every request path EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimization)
     *  - favicon.ico, sitemap.xml, robots.txt
     *  - Any file with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
