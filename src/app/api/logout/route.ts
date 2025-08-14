import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== LOGOUT API CALLED ===');
  
  try {
    // Debug: Log all cookies
    console.log('All cookies before clearing:', request.cookies.getAll());
    
    // Create absolute URL for redirect
    const baseUrl = new URL(request.url);
    const redirectUrl = new URL('/', baseUrl.origin);
    redirectUrl.searchParams.set('logout', 'true');
    redirectUrl.searchParams.set('t', Date.now().toString());
    
    // Create redirect response with cookie clearing
    const response = NextResponse.redirect(redirectUrl);
    
    // Clear the httpOnly session cookie with maxAge: 0
    response.cookies.set('auth0_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
    
    // Also try deleting it
    response.cookies.delete('auth0_session');
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    console.log('Server-side session cookie cleared');
    
    // Step 2: Redirect to Auth0's logout endpoint to clear Auth0's session
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const returnTo = encodeURIComponent(redirectUrl.toString());
    
    console.log('Auth0 config:', { auth0Domain, clientId, returnTo });
    
    if (!auth0Domain || !clientId) {
      console.log('Auth0 environment variables not set, redirecting directly to home');
      return response; // Return the response with cleared cookies
    }
    
    // Check if auth0Domain already includes protocol
    const domain = auth0Domain.startsWith('http') ? auth0Domain : `https://${auth0Domain}`;
    const auth0LogoutUrl = `${domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`;
    
    console.log('Redirecting to Auth0 logout:', auth0LogoutUrl);
    return NextResponse.redirect(auth0LogoutUrl);
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
