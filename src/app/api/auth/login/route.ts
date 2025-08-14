import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== AUTH0 LOGIN DEBUG ===');
    
    const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    const redirectUri = 'http://localhost:3000/api/auth/callback';
    
    console.log('Environment Variables:', {
      issuerUrl,
      clientId: clientId ? 'SET' : 'MISSING',
      baseUrl,
      redirectUri
    });
    
    if (!issuerUrl || !clientId) {
      console.error('Missing required environment variables');
      return NextResponse.json({ error: 'Auth0 configuration missing' }, { status: 500 });
    }
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build Auth0 authorization URL
    const authUrl = new URL('/authorize', issuerUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    
    console.log('Final Auth URL:', authUrl.toString());
    
    // Redirect to Auth0
    return NextResponse.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}