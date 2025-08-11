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
    const decoded = payload as { userId?: string };
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// GET current shift for the authenticated user
export const GET = async (request: NextRequest) => {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User accessing current shift API:', {
      id: user.id,
      name: user.name,
      role: user.role,
      locationId: user.locationId
    });

    // Only care workers can access this endpoint
    if (user.role !== 'CARE_WORKER') {
      console.log('Access denied for role:', user.role);
      return NextResponse.json(
        { message: 'Access denied - Only care workers can access this endpoint' },
        { status: 403 }
      );
    }

    // Find the current active shift for the user
    const currentShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        endTime: null // Active shift (not ended)
      },
      include: {
        timeEntries: {
          orderBy: {
            clockInTime: 'desc'
          }
        }
      }
    });

    console.log('Current shift for user:', user.id, 'is:', currentShift ? 'found' : 'not found');

    return NextResponse.json({
      shift: currentShift,
      message: currentShift ? 'Current shift retrieved successfully' : 'No active shift found'
    });

  } catch (error) {
    console.error('Error fetching current shift:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};
