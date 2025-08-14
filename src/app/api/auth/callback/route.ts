import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH0 CALLBACK DEBUG ===');
    console.log('Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('Callback parameters:', {
      code: code ? 'PRESENT' : 'MISSING',
      error,
      errorDescription,
    });
    
    const baseUrl = process.env.AUTH0_BASE_URL;
    
    if (error) {
      console.error('Auth0 error:', error, errorDescription);
      return NextResponse.redirect(`${baseUrl}?error=${error}&description=${errorDescription || ''}`);
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${baseUrl}?error=no_code`);
    }
    
    console.log('Exchanging code for tokens...');
    
    const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch(`${issuerUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response:', tokens);
    
    if (tokens.error) {
      console.error('Token exchange failed:', tokens);
      return NextResponse.redirect(`${baseUrl}?error=token_exchange_failed&details=${tokens.error}`);
    }
    
    console.log('Getting user info...');
    
    // Get user info from Auth0
    const userResponse = await fetch(`${issuerUrl}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    const auth0User = await userResponse.json();
    
    console.log('Auth0 user info:', auth0User);
    
    // Check if user exists in database
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth0Id: auth0User.sub },
          { email: auth0User.email }
        ]
      },
      include: {
        location: true
      }
    });
    
    let isNewUser = false;
    
    if (!dbUser) {
      console.log('Creating new user in database...');
      
      // Create new user without role and location (will be set during onboarding)
      dbUser = await prisma.user.create({
        data: {
          auth0Id: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name || auth0User.email,
          // role and locationId will be null initially
        },
        include: {
          location: true
        }
      });
      
      console.log('New user created:', dbUser);
      isNewUser = true;
    } else {
      console.log('Existing user found:', dbUser);
      
      // Update auth0Id if not set
      if (!dbUser.auth0Id) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { auth0Id: auth0User.sub },
          include: {
            location: true
          }
        });
      }
    }
    
    // Create enhanced user object with database info
    const enhancedUser = {
      ...auth0User,
      id: dbUser.id,
      role: dbUser.role,
      locationId: dbUser.locationId,
      location: dbUser.location,
      auth0Id: dbUser.auth0Id
    };
    
    console.log('Enhanced user object:', enhancedUser);
    
    // Determine redirect URL based on user status
    let redirectUrl = baseUrl;
    
    if (isNewUser || !dbUser.role || !dbUser.locationId) {
      // New user or incomplete profile - redirect to onboarding
      redirectUrl = `${baseUrl}/onboarding`;
      console.log('Redirecting to onboarding');
    } else {
      // Existing user with complete profile - redirect based on role
      switch (dbUser.role) {
        case 'CARE_WORKER':
          redirectUrl = `${baseUrl}/worker`;
          break;
        case 'MANAGER':
        case 'ADMIN':
          redirectUrl = `${baseUrl}/manager`;
          break;
        default:
          redirectUrl = `${baseUrl}/onboarding`;
      }
      console.log('Redirecting to dashboard:', redirectUrl);
    }
    
    // Set session cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('auth0_session', JSON.stringify({ 
      user: enhancedUser, 
      tokens 
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log('=== AUTH0 CALLBACK SUCCESS ===');
    return response;
  } catch (error) {
    console.error('Callback error:', error);
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}?error=callback_failed`);
  }
} 