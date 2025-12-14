import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("customerToken");

  // Protect dashboard and customer portal - require authentication
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customer/portal")
  ) {
    if (!token) {
      // Redirect to home page if not authenticated
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect order pages - require authentication
  if (pathname.startsWith("/order")) {
    if (!token) {
      // Redirect to home page if not authenticated
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
