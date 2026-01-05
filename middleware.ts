import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If this is a LINE OAuth callback on the root path, redirect to /callback
  if (pathname === '/' && (searchParams.has('code') || searchParams.has('liffClientId'))) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/callback';
    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match any request path to catch LINE OAuth callbacks
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
