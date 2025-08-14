import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('=== FETCHING LOCATIONS ===');
    
    // Get the user's location from the session
    const sessionCookie = request.cookies.get('auth0_session');
    let userLocationId: string | null = null;
    
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.user?.locationId) {
          userLocationId = session.user.locationId;
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    
    // Build the where clause
    const whereClause: {
      isActive: boolean;
      id?: string;
    } = {
      isActive: true
    };
    
    // If user has a location assigned, only show that location
    if (userLocationId) {
      whereClause.id = userLocationId;
    }
    
    const locations = await prisma.location.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Found locations:', locations.length);

    return NextResponse.json({
      locations: locations
    });

  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



