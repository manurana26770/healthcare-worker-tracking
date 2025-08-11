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
      include: {
        location: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// Helper function to check if user is within perimeter
function isWithinPerimeter(
  userLat: number, 
  userLng: number, 
  locationLat: number, 
  locationLng: number, 
  radius: number
): boolean {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (locationLat * Math.PI) / 180;
  const Δφ = ((locationLat - userLat) * Math.PI) / 180;
  const Δλ = ((locationLng - userLng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance <= radius;
}

// POST clock in
export const POST = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only care workers can clock in
    if (user.role !== 'CARE_WORKER') {
      return NextResponse.json(
        { message: 'Only care workers can clock in' },
        { status: 403 }
      );
    }

    const { note, latitude, longitude } = await request.json();

    // Validate location data
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { message: 'Invalid location data' },
        { status: 400 }
      );
    }

    // Check if user has an assigned location
    if (!user.location) {
      return NextResponse.json(
        { message: 'No location assigned to user' },
        { status: 400 }
      );
    }

    // Check if user is within perimeter
    const withinPerimeter = isWithinPerimeter(
      latitude,
      longitude,
      user.location.latitude,
      user.location.longitude,
      user.location.radius
    );

    if (!withinPerimeter) {
      return NextResponse.json(
        { message: 'You must be within the facility perimeter to clock in' },
        { status: 400 }
      );
    }

    // Check if user is already clocked in
    const existingActiveEntry = await prisma.timeEntry.findFirst({
      where: {
        shift: {
          userId: user.id
        },
        clockOutTime: null
      }
    });

    if (existingActiveEntry) {
      return NextResponse.json(
        { message: 'You are already clocked in' },
        { status: 400 }
      );
    }

    // Get or create current shift
    let currentShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        endTime: null
      }
    });

    if (!currentShift) {
      // Create new shift
      currentShift = await prisma.shift.create({
        data: {
          userId: user.id,
          locationId: user.locationId!,
          startTime: new Date()
        }
      });
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        shiftId: currentShift.id,
        clockInTime: new Date(),
        note: note || null,
        clockInLatitude: latitude,
        clockInLongitude: longitude
      }
    });

    return NextResponse.json({
      timeEntry,
      message: 'Successfully clocked in'
    }, { status: 201 });

  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};
