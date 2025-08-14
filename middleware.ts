import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./src/lib/auth0";

export async function middleware(request: NextRequest) {
  // Skip Auth0 middleware for logout routes
  if (request.nextUrl.pathname === '/api/auth/logout' || 
      request.nextUrl.pathname === '/api/logout' ||
      request.nextUrl.pathname.startsWith('/api/logout')) {
    console.log('Skipping Auth0 middleware for logout route');
    return NextResponse.next();
  }
  
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - api/auth/logout (our custom logout route)
     * - api/auth/signout (our custom signout route)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth/logout|api/auth/signout).*)",
  ],
};