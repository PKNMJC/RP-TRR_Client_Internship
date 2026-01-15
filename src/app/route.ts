import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Check if this is a LINE OAuth callback
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const liffClientId = searchParams.get('liffClientId');
  const liffRedirectUri = searchParams.get('liffRedirectUri');

  console.log('Root GET handler - checking for LINE callback:', {
    code: !!code,
    state: !!state,
    liffClientId: !!liffClientId,
  });

  if (liffClientId || liffRedirectUri) {
    console.log('LIFF request detected at root - redirecting to LIFF entry point');
    const liffEntryUrl = new URL('/repairs/liff', request.nextUrl.origin);
    searchParams.forEach((value, key) => liffEntryUrl.searchParams.append(key, value));
    return NextResponse.redirect(liffEntryUrl.toString());
  }

  if (code) {
    const baseUrl = request.nextUrl.origin;
    const callbackUrl = new URL('/callback', baseUrl);
    if (code) callbackUrl.searchParams.append('code', code);
    if (state) callbackUrl.searchParams.append('state', state);
    return NextResponse.redirect(callbackUrl.toString());
  }

  // Not a callback, redirect to login
  console.log('Not a LINE callback, redirecting to login');
  return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
}
