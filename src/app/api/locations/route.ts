import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as any;
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// GET all locations (filtered by user's location)
export const GET = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let locations;
    
    // Admin can see all locations
    if (user.role === 'ADMIN') {
      locations = await prisma.location.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Managers and Care Workers can only see their assigned location
      if (!user.locationId) {
        return NextResponse.json({
          locations: [],
          message: 'No location assigned to user'
        });
      }
      
      locations = await prisma.location.findMany({
        where: {
          id: user.locationId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({
      locations,
      message: 'Locations retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST new location (only admin can create locations)
export const POST = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can create locations
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only administrators can create locations' },
        { status: 403 }
      );
    }

    const { name, address, latitude, longitude, radius, isActive = true } = await request.json();

    // Validate required fields
    if (!name || !address || latitude === undefined || longitude === undefined || radius === undefined) {
      return NextResponse.json(
        { message: 'Name, address, latitude, longitude, and radius are required' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { message: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { message: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Validate radius
    if (radius < 100 || radius > 10000) {
      return NextResponse.json(
        { message: 'Radius must be between 100 and 10000 meters' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        radius,
        isActive
      }
    });

    return NextResponse.json({
      location,
      message: 'Location created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}; 