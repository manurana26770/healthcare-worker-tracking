import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}?error=${error}`);
    }
    
    if (!code) {
      return NextResponse.redirect(`${request.nextUrl.origin}?error=no_code`);
    }
    
    // Exchange code for tokens
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
    
    const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      return NextResponse.redirect(`${request.nextUrl.origin}?error=token_exchange_failed`);
    }
    
    // Get user info
    const userResponse = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    const user = await userResponse.json();
    
    // Set session cookie (simplified - in production use proper session management)
    const response = NextResponse.redirect(request.nextUrl.origin);
    response.cookies.set('auth0_session', JSON.stringify({ user, tokens }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}?error=callback_failed`);
  }
} 