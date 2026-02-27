import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher(["/trips/(.*)/itinerary"]);
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)"]);

const isDev = process.env.NODE_ENV === "development";

/**
 * Access logging middleware
 * Logs page navigations with method, path, duration
 *
 * Skips logging for:
 * - API routes (tRPC middleware handles those)
 * - Static assets
 */
function logAccess(
  req: NextRequest,
  response: NextResponse,
  startTime: number,
  userId?: string | null,
) {
  const path = req.nextUrl.pathname;

  // Skip logging for API routes (tRPC has its own logging) and static assets
  if (path.startsWith("/api/") || path.startsWith("/_next/")) {
    return;
  }

  const duration = Date.now() - startTime;

  if (isDev) {
    // Simple dev output with color
    console.log(
      `\x1b[34m[access]\x1b[0m ${req.method} ${path} ${response.status} \x1b[90m(${duration}ms)\x1b[0m`,
    );
  } else {
    // Structured JSON for Vercel
    console.log(
      JSON.stringify({
        level: "info",
        context: "access",
        method: req.method,
        path,
        status: response.status,
        durationMs: duration,
        userAgent: req.headers.get("user-agent")?.slice(0, 100),
        ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
        userId: userId ?? undefined,
      }),
    );
  }
}

export default clerkMiddleware(async (auth, req) => {
  const startTime = Date.now();
  const authData = await auth();

  // Handle protected routes
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }

  const response = NextResponse.next();

  // Log access after processing
  logAccess(req, response, startTime, authData.userId);

  return response;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
