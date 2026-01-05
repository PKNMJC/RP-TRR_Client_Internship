import { type NextRequest } from 'next/server';

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

  if (code || liffClientId) {
    // Build callback URL with all parameters
    const baseUrl = request.nextUrl.origin;
    const callbackUrl = new URL('/callback', baseUrl);

    if (code) callbackUrl.searchParams.append('code', code);
    if (state) callbackUrl.searchParams.append('state', state);
    if (liffClientId) callbackUrl.searchParams.append('liffClientId', liffClientId);
    if (liffRedirectUri) callbackUrl.searchParams.append('liffRedirectUri', liffRedirectUri);

    console.log('Redirecting to callback:', callbackUrl.toString());

    return Response.redirect(callbackUrl.toString());
  }

  // Not a callback, return the home page
  console.log('Not a LINE callback, serving home page');
  const { notFound } = await import('next/navigation');
  notFound();
}
