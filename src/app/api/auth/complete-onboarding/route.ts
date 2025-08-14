import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPLETE ONBOARDING ===');
    
    // Get session to find current user
    const sessionCookie = request.cookies.get('auth0_session');
    
    if (!sessionCookie?.value) {
      console.error('No session cookie found');
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const auth0User = session.user;
    
    if (!auth0User?.auth0Id) {
      console.error('No Auth0 user found in session');
      return NextResponse.json({ error: 'No Auth0 user found' }, { status: 401 });
    }

    // Get onboarding data from request body
    const requestBody = await request.json();
    console.log('Raw request body:', requestBody);
    
    // Handle both object format and direct value format
    let role, locationId;
    
    if (typeof requestBody.role === 'object' && requestBody.role.value) {
      role = requestBody.role.value;
    } else {
      role = requestBody.role;
    }
    
    if (typeof requestBody.locationId === 'object' && requestBody.locationId.value) {
      locationId = requestBody.locationId.value;
    } else {
      locationId = requestBody.locationId;
    }
    
    console.log('Processed onboarding data:', { role, locationId });
    console.log('Auth0 user:', auth0User);

    // Validate role
    if (!role || !['CARE_WORKER', 'MANAGER', 'ADMIN'].includes(role)) {
      console.error('Invalid role:', role);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate locationId
    if (!locationId) {
      console.error('Missing locationId');
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      console.error('Location not found:', locationId);
      return NextResponse.json({ error: 'Location not found' }, { status: 400 });
    }

    console.log('Found location:', location);

    // Update user with role and location
    const updatedUser = await prisma.user.update({
      where: { auth0Id: auth0User.auth0Id },
      data: {
        role: role,
        locationId: locationId
      },
      include: {
        location: true
      }
    });

    console.log('User updated:', updatedUser);

    // Create enhanced user object
    const enhancedUser = {
      ...auth0User,
      id: updatedUser.id,
      role: updatedUser.role,
      locationId: updatedUser.locationId,
      location: updatedUser.location,
      auth0Id: updatedUser.auth0Id
    };

    // Update session with new user data
    const response = NextResponse.json({ 
      success: true, 
      user: enhancedUser 
    });
    
    response.cookies.set('auth0_session', JSON.stringify({ 
      user: enhancedUser, 
      tokens: session.tokens 
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('=== ONBOARDING COMPLETED ===');
    return response;

  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json({ 
      error: 'Onboarding failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


