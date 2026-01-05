import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // If this is a LINE OAuth callback, redirect to /callback
  if (code) {
    const callbackUrl = new URL('/callback', request.url);
    callbackUrl.searchParams.set('code', code);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // Otherwise, rewrite to the home page
  return NextResponse.rewrite(new URL('/home', request.url));
}
