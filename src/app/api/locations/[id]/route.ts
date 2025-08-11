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

// Helper function to check if user can access location
function canAccessLocation(user: any, locationId: string) {
  // Admin can access all locations
  if (user.role === 'ADMIN') {
    return true;
  }
  
  // Other users can only access their assigned location
  return user.locationId === locationId;
}

// GET location by ID
export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: params.id }
    });

    if (!location) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user can access this location
    if (!canAccessLocation(user, params.id)) {
      return NextResponse.json(
        { message: 'Access denied to this location' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      location,
      message: 'Location retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PUT update location
export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and managers can update locations
    if (user.role === 'CARE_WORKER') {
      return NextResponse.json(
        { message: 'Care workers cannot update locations' },
        { status: 403 }
      );
    }

    // Check if user can access this location
    if (!canAccessLocation(user, params.id)) {
      return NextResponse.json(
        { message: 'Access denied to this location' },
        { status: 403 }
      );
    }

    const { name, address, latitude, longitude, radius, isActive } = await request.json();

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

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        name,
        address,
        latitude,
        longitude,
        radius,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      location,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Error updating location:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE location
export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can delete locations
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only administrators can delete locations' },
        { status: 403 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id }
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      );
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}; 