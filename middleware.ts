import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("customerToken")?.value;

  // Protect dashboard routes - require authentication
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect customer portal and order pages - require authentication
  if (
    pathname.startsWith("/customer/portal") ||
    pathname.startsWith("/order")
  ) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
