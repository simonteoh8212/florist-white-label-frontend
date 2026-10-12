import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // 1. Bypass Next.js internal paths, static files, and api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/stores") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Read and normalize host header
  const host = req.headers.get("host")?.toLowerCase() || "";
  // Strip port (e.g. "autarix.localhost:3000" -> "autarix.localhost")
  const hostname = host.split(":")[0];

  // 3. Cleanly extract subdomain across local dev & production
  let subdomain: string | null = null;

  if (hostname.endsWith(".localhost")) {
    subdomain = hostname.slice(0, -".localhost".length);
  } else if (hostname.endsWith(".flowerapp.my")) {
    subdomain = hostname.slice(0, -".flowerapp.my".length);
  } else {
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[parts.length - 1] !== "localhost") {
      subdomain = parts[0];
    }
  }

  // 4. Ignore root domain, "www", or empty subdomains
  if (
    !subdomain ||
    subdomain === "www" ||
    subdomain === "flowerapp" ||
    subdomain === "localhost"
  ) {
    return NextResponse.next();
  }

  // 5. If path already targets /store/[subdomain], do not double rewrite
  if (pathname.startsWith(`/store/${subdomain}`)) {
    return NextResponse.next();
  }

  // 6. Rewrite internally to /store/[subdomain][pathname]
  url.pathname = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets with file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
